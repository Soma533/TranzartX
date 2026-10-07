"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Msg { id: string; body: string; sender_id: string; created_at: string; }

function MessagesInner() {
  const router = useRouter();
  const search = useSearchParams();
  const to = search.get("to");
  const [conversations, setConversations] = useState<{ conversation_id: string; with?: { id: string; name: string } | null }[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const { push } = useToast();

  async function loadList(select?: string) {
    const r = await fetch("/api/messages");
    if (r.status === 401) { router.replace("/login"); return; }
    const j = await r.json().catch(() => null);
    const list = j?.conversations ?? [];
    setConversations(list);
    if (select) setActive(select);
    else if (list[0] && !active) setActive(list[0].conversation_id);
  }

  useEffect(() => {
    // Deep link ?to=<profileId> starts (or reuses) a conversation — PRD §18.
    if (to) {
      fetch("/api/messages/conversations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: to })
      })
        .then((r) => {
          if (r.status === 401) { push("Log in to message"); router.replace("/login"); return null; }
          return r.json();
        })
        .then((j) => { if (j?.conversation_id) loadList(j.conversation_id); else if (j) push("Could not start conversation"); })
        .catch(() => push("Could not start conversation"));
    } else {
      loadList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);

  useEffect(() => {
    if (!active) return;
    fetch(`/api/messages?conversation=${active}`).then((r) => r.json()).then((j) => setMessages(j.messages ?? [])).catch(() => null);
    const supabase = createClient();
    const ch = supabase.channel(`msg:${active}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${active}` }, (payload) => {
        setMessages((m) => [...m, payload.new as Msg]);
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [active]);

  async function send() {
    if (!active || !draft.trim()) return;
    const r = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversation_id: active, body: draft }) });
    if (!r.ok) push("Send failed — sign in first");
    setDraft("");
  }

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
          {messages.map((m) => <p key={m.id} className="rounded-lg bg-secondary px-3 py-2 text-sm">{m.body}</p>)}
          {!active && <p className="text-sm text-muted-foreground">Select or start a conversation.</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a professional message…" />
            <Button onClick={send} className="sm:shrink-0">Send</Button>
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
