"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Suspense, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { ChatThread, Composer, type Msg } from "@/components/chat-thread";
import { useToast } from "@/hooks/use-toast";

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
  const endRef = useRef<HTMLDivElement>(null);
  const { push } = useToast();

  // Keep the newest message in view as messages arrive (phone + desktop).
  // scrollIntoView works for both the desktop scroller and the mobile page.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

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
      {/* Phone: stacked vertical list, matching the desktop sidebar rhythm. */}
      <div className="md:hidden">
        <p className="mb-2 text-sm font-semibold">Conversations</p>
        {conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No conversations yet — find people on the Network tab.</p>
        ) : (
          <div className="grid gap-1">
            {conversations.map((c) => (
              <button
                key={c.conversation_id}
                onClick={() => setActive(c.conversation_id)}
                className={`block w-full truncate rounded-lg border px-3 py-2.5 text-left text-sm ${c.conversation_id === active ? "border-primary bg-primary text-white" : "bg-white"}`}
              >
                {c.with?.name ?? `${c.conversation_id.slice(0, 8)}…`}
              </button>
            ))}
          </div>
        )}
      </div>
      <Card className="hidden md:block">
        <p className="font-semibold">Conversations</p>
        {conversations.map((c) => (
          <button key={c.conversation_id} onClick={() => setActive(c.conversation_id)} className={`mt-2 block w-full truncate rounded-lg border px-2 py-1 text-left text-sm ${c.conversation_id === active ? "bg-primary text-white" : ""}`}>
            {c.with?.name ?? `${c.conversation_id.slice(0, 8)}…`}
          </button>
        ))}
        {conversations.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No conversations yet — find people on the Network tab.</p>}
      </Card>
      <Card className="flex flex-col p-3 md:col-span-2 md:p-4">
        <ChatThread messages={messages} myId={myId} active={active !== null} starting={starting} endRef={endRef} />
        {/* Composer pinned above the keyboard/home indicator on phones. */}
        <div className="sticky bottom-0 mt-2 bg-card pt-2" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <Composer
            draft={draft}
            setDraft={setDraft}
            boxRef={boxRef}
            send={send}
            disabled={sendDisabled}
            starting={starting}
            sending={sending}
            active={active !== null}
            hasTarget={Boolean(to)}
          />
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
