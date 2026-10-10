"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Suspense, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Msg { id: string; body: string; sender_id: string; created_at: string; delivered_at: string | null; read_at: string | null; }

/** Chat bubble clock: time for today, "Yesterday 14:05" for older (PRD §18). */
function stamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return time;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const prefix = d.toDateString() === yesterday.toDateString() ? "Yesterday " : `${d.toLocaleDateString([], { day: "numeric", month: "short" })} `;
  return prefix + time;
}

/** WhatsApp-style ticks: ✓ sent, ✓✓ delivered, blue ✓✓ read. */
function Ticks({ m, mine }: { m: Msg; mine: boolean }) {
  if (!mine) return null;
  if (m.read_at) return <span className="ml-2 text-sky-500">✓✓</span>;
  if (m.delivered_at) return <span className="ml-2 text-muted-foreground">✓✓</span>;
  return <span className="ml-2 text-muted-foreground">✓</span>;
}

function MessagesInner() {
  const router = useRouter();
  const search = useSearchParams();
  const to = search.get("to");
  const [conversations, setConversations] = useState<{ conversation_id: string; with?: { id: string; name: string } | null }[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const { push } = useToast();

  useEffect(() => {
    fetch("/api/profiles/me").then((r) => r.json()).then((j) => {
      if (j.profile) setMyId(j.profile.id as string);
    }).catch(() => null);
  }, []);

  async function loadList(select?: string) {
    const r = await fetch("/api/messages");
    if (r.status === 401) { router.replace("/login"); return; }
    const j = await r.json().catch(() => null);
    const list = j?.conversations ?? [];
    setConversations(list);
    // Avoid the stale-closure `!active` check: prefer explicit select, else first.
    setActive((prev) => select ?? prev ?? list[0]?.conversation_id ?? null);
  }

  async function ensureConversation(targetId: string): Promise<string | null> {
    try {
      const r = await fetch("/api/messages/conversations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId })
      });
      if (r.status === 401) { push("Log in to message"); router.replace("/login"); return null; }
      const j = await r.json().catch(() => null);
      if (j?.conversation_id) return j.conversation_id as string;
      push(j?.error?.message ?? "Could not start conversation");
      return null;
    } catch {
      push("Could not start conversation");
      return null;
    }
  }

  useEffect(() => {
    // Deep link ?to=<profileId> starts (or reuses) a conversation — PRD §18.
    let cancelled = false;
    async function boot() {
      if (to) {
        setStarting(true);
        const cid = await ensureConversation(to);
        if (cancelled) return;
        if (cid) await loadList(cid);
        else await loadList();
        if (!cancelled) setStarting(false);
      } else {
        await loadList();
      }
    }
    void boot();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    fetch(`/api/messages?conversation=${active}`)
      .then((r) => {
        if (r.status === 401) { router.replace("/login"); return null; }
        return r.json();
      })
      .then((j) => { if (!cancelled && j) setMessages(j.messages ?? []); })
      .catch(() => null);
    const supabase = createClient();
    const ch = supabase.channel(`msg:${active}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${active}` }, (payload) => {
        const incoming = payload.new as Msg;
        // Dedupe against the optimistic append in send().
        setMessages((m) => (m.some((x) => x.id === incoming.id) ? m : [...m, incoming]));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${active}` }, (payload) => {
        // Tick flips (delivered/read) arrive live without refresh.
        const updated = payload.new as Msg;
        setMessages((m) => m.map((x) => (x.id === updated.id ? { ...x, delivered_at: updated.delivered_at, read_at: updated.read_at } : x)));
      })
      .subscribe();
    return () => { cancelled = true; void supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  async function send() {
    if (!draft.trim() || sending || starting) return;
    // Lazily (re)create the conversation so Send never silently no-ops when
    // the deep-link start failed or hasn't finished yet.
    let cid = active;
    if (!cid) {
      if (!to) { push("Select or start a conversation first"); return; }
      setStarting(true);
      try {
        cid = await ensureConversation(to);
      } finally {
        setStarting(false);
      }
      if (!cid) return;
      setActive(cid);
    }
    const body = draft.trim();
    setSending(true);
    try {
      const r = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversation_id: cid, body }) });
      const j = await r.json().catch(() => null);
      if (!r.ok) {
        if (r.status === 401) router.replace("/login");
        push(j?.error?.message ?? "Send failed — sign in first");
        return;
      }
      // Optimistic (server-confirmed) append: UI updates even if Realtime is off.
      if (j?.message) {
        const saved = j.message as Msg;
        setMessages((m) => (m.some((x) => x.id === saved.id) ? m : [...m, saved]));
      }
      setDraft("");
      if (boxRef.current) boxRef.current.style.height = "auto";
    } catch {
      push("Send failed — check your connection");
    } finally {
      setSending(false);
    }
  }

  const sendDisabled = !draft.trim() || sending || starting;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <p className="font-semibold">Conversations</p>
        {conversations.map((c) => (
          <button key={c.conversation_id} onClick={() => setActive(c.conversation_id)} className={`mt-2 block w-full truncate rounded-lg border px-2 py-1 text-left text-sm ${c.conversation_id === active ? "bg-primary text-white" : ""}`}>
            {c.with?.name ?? `${c.conversation_id.slice(0, 8)}…`}
          </button>
        ))}
        {conversations.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No conversations yet — find people on the Network tab.</p>}
      </Card>
      <Card className="md:col-span-2">
        <div className="grid gap-2">
          {messages.map((m) => {
            const mine = myId !== null && m.sender_id === myId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <span className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] leading-none ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {stamp(m.created_at)}
                    <Ticks m={m} mine={mine} />
                  </span>
                </div>
              </div>
            );
          })}
          {!active && (
            <p className="text-sm text-muted-foreground">
              {starting ? "Starting conversation…" : "Select or start a conversation."}
            </p>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              ref={boxRef}
              rows={1}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                // Auto-grow: 1 row up to ~8 rows, then scroll.
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 176)}px`;
              }}
              onKeyDown={(e) => {
                // Enter inserts a line break; Ctrl/Cmd+Enter sends (WhatsApp-style).
                if (e.key === "Enter" && !e.shiftKey && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={active
                ? "Write a professional message… (Enter for a new line, Ctrl+Enter to send)"
                : to
                  ? "Starting conversation — type, then Send…"
                  : "Select a conversation first…"}
            />
            <Button
              type="button"
              onClick={send}
              disabled={sendDisabled}
              title={sendDisabled && !draft.trim() ? "Type a message first" : !active && !to ? "Select a conversation first" : "Send message (Ctrl+Enter)"}
              className="shrink-0"
            >
              {sending ? "Sending…" : starting ? "Starting…" : "Send"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading messages…</p>}>
      <MessagesInner />
    </Suspense>
  );
}
