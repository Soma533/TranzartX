"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { ChatThread, type Msg } from "@/components/chat-thread";
import { Composer } from "@/components/chat-composer";
import { ChatHeader } from "@/components/chat-header";
import { ForwardDialog } from "@/components/forward-dialog";
import { ConversationList } from "@/components/conversation-list";
import { ReplyBar } from "@/components/reply-bar";
import { useMessages } from "@/hooks/use-messages";
import { useToast } from "@/hooks/use-toast";

function MessagesInner() {
  const { push } = useToast();
  const router = useRouter();
  const chat = useMessages(push);
  const { conversations, active, setActive, messages, setMessages, lastReadAt, starting,
    setStarting, myId, online, endRef, loadList, ensureConversation, to } = chat;

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [forwarding, setForwarding] = useState<Msg | null>(null);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);

  const peer = conversations.find((c) => c.conversation_id === active)?.with ?? null;

  async function send() {
    if (!draft.trim() || sending || starting) return;
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
      const r = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversation_id: cid, body, reply_to_id: replyTo?.id ?? null }) });
      const j = await r.json().catch(() => null);
      if (!r.ok) {
        if (r.status === 401) router.replace("/login");
        push(j?.error?.message ?? "Send failed — sign in first");
        return;
      }
      if (j?.message) {
        const saved = j.message as Msg;
        setMessages((m) => (m.some((x) => x.id === saved.id) ? m : [...m, saved]));
      }
      setDraft("");
      setReplyTo(null);
      if (boxRef.current) boxRef.current.style.height = "auto";
      // Refresh the inbox so this thread jumps to the top.
      void loadList(cid ?? undefined);
    } catch {
      push("Send failed — check your connection");
    } finally {
      setSending(false);
    }
  }

  async function copyMessage(m: Msg) {
    try {
      await navigator.clipboard.writeText(m.body);
      push("Copied to clipboard");
    } catch {
      push("Couldn't copy — select the text instead");
    }
  }

  async function deleteMessage(m: Msg) {
    const r = await fetch("/api/messages", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: m.id })
    });
    const j = await r.json().catch(() => null);
    if (r.ok) {
      setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, deleted_at: new Date().toISOString() } : x)));
      push("Message deleted");
    } else {
      push(j?.error?.message ?? "Delete failed");
    }
  }

  async function saveEdit(id: string, body: string) {
    const clean = body.trim();
    setEditingId(null);
    if (!clean) return;
    const r = await fetch("/api/messages", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, body: clean })
    });
    const j = await r.json().catch(() => null);
    if (r.ok && j?.message) {
      const saved = j.message as Msg;
      setMessages((list) => list.map((x) => (x.id === id ? { ...x, ...saved } : x)));
      push("Message updated");
    } else {
      push(j?.error?.message ?? "Edit failed");
    }
  }

  async function forwardTo(target: string) {
    const m = forwarding;
    setForwarding(null);
    if (!m) return;
    const r = await fetch("/api/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: m.id, to: target })
    });
    const j = await r.json().catch(() => null);
    if (r.ok) {
      push("Message forwarded");
      void loadList();
    } else {
      push(j?.error?.message ?? "Forward failed");
    }
  }

  const actions = {
    onReply: (m: Msg) => { setReplyTo(m); boxRef.current?.focus(); },
    onEdit: (m: Msg) => setEditingId(m.id),
    onDelete: (m: Msg) => void deleteMessage(m),
    onForward: (m: Msg) => setForwarding(m),
    onCopy: (m: Msg) => void copyMessage(m),
    onSaveEdit: (id: string, body: string) => void saveEdit(id, body),
    onCancelEdit: () => setEditingId(null)
  };

  const sendDisabled = !draft.trim() || sending || starting;

  return (
    <div className="grid overflow-hidden rounded-2xl border md:h-[calc(100vh-11rem)] md:grid-cols-[320px_1fr]">
      {/* Thread list — full width on phones, left rail on larger screens. */}
      <section className={`overflow-y-auto border-r ${active ? "hidden md:block" : "block"}`} aria-label="Conversations">
        <h1 className="border-b px-4 py-3 text-lg font-bold">Messages</h1>
        <ConversationList items={conversations} active={active} onSelect={setActive} />
      </section>

      {/* Conversation */}
      <section className={`flex min-h-[60vh] flex-col ${active ? "flex" : "hidden md:flex"}`} aria-label="Conversation">
        {active ? (
          <>
            <ChatHeader peer={peer} isOnline={Boolean(online[peer?.id ?? ""])} onBack={() => setActive(null)} />
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <ChatThread
                messages={messages}
                myId={myId}
                active={active !== null}
                starting={starting}
                endRef={endRef}
                editingId={editingId}
                actions={actions}
                lastReadAt={lastReadAt}
              />
            </div>
            <div className="sticky bottom-0 border-t bg-white p-2" style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}>
              <ReplyBar target={replyTo} onCancel={() => setReplyTo(null)} />
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
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
            {starting ? "Starting conversation…" : "Select a conversation to start messaging."}
          </div>
        )}
      </section>

      {forwarding && (
        <ForwardDialog message={forwarding} people={conversations} onPick={forwardTo} onClose={() => setForwarding(null)} />
      )}
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