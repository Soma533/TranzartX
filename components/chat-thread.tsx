"use client";
import type { RefObject } from "react";
import { MessageBubble } from "@/components/chat-bubble";

export interface Msg {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
  edited_at?: string | null;
  deleted_at?: string | null;
  forwarded_from?: string | null;
  reply_to_id?: string | null;
  attachment_url?: string | null;
  attachment_type?: "image" | "audio" | "file" | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
  attachment_duration_ms?: number | null;
}

/** Chat bubble clock: time for today, "Yesterday 14:05" for older (PRD §18). */
function stamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return time;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const prefix = d.toDateString() === yesterday.toDateString()
    ? "Yesterday "
    : `${d.toLocaleDateString([], { day: "numeric", month: "short" })} `;
  return prefix + time;
}

/** Inbox timestamp: time today, weekday this week, otherwise a date. */
export function listStamp(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const diff = (today.getTime() - d.getTime()) / 86400000;
  if (diff < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

/** "Last seen ..." text for the conversation header. */
export function lastSeenLabel(iso: string | null | undefined, online: boolean): string {
  if (online) return "Active now";
  if (!iso) return "Offline";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "Last seen just now";
  if (diff < 3_600_000) return `Last seen ${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `Last seen ${Math.floor(diff / 3_600_000)} hr ago`;
  return `Last seen ${new Date(iso).toLocaleDateString([], { day: "numeric", month: "short" })}`;
}

interface ThreadProps {
  messages: Msg[];
  myId: string | null;
  active: boolean;
  starting: boolean;
  endRef: RefObject<HTMLDivElement | null>;
  editingId: string | null;
  actions: {
    onReply: (m: Msg) => void;
    onEdit: (m: Msg) => void;
    onDelete: (m: Msg) => void;
    onForward: (m: Msg) => void;
    onCopy: (m: Msg) => void;
    onOpenActions: (m: Msg) => void;
    onSaveEdit: (id: string, body: string) => void;
    onCancelEdit: () => void;
  };
  lastReadAt: string | null;
}

/** Message thread: own bubbles right, theirs left. Unread arrivals are tinted. */
export function ChatThread({ messages, myId, active, starting, endRef, editingId, actions, lastReadAt }: ThreadProps) {
  const boundary = lastReadAt ? new Date(lastReadAt).getTime() : 0;
  const byId = new Map(messages.map((m) => [m.id, m]));
  return (
    <div className="grid gap-1.5 md:flex-1 md:overflow-y-auto">
      {messages.map((m) => {
        const mine = myId !== null && m.sender_id === myId;
        const unread = !mine && m.read_at === null;
        // Highlight only the run of messages that arrived while you were away.
        const isNew = unread && (!boundary || new Date(m.created_at).getTime() > boundary);
        const replyTo = m.reply_to_id ? byId.get(m.reply_to_id) ?? null : null;
        const dated = stamp(m.created_at);
        return (
          <div key={m.id}>
            {/* Date divider, so long threads stay readable. */}
            {isDayStart(messages, m.id) && (
              <p className="my-2 text-center text-[10px] uppercase tracking-wide text-muted-foreground">{dated}</p>
            )}
            <MessageBubble
              m={m}
              mine={mine}
              isNew={isNew}
              replyTo={replyTo}
              editing={editingId === m.id}
              onSaveEdit={actions.onSaveEdit}
              onCancelEdit={actions.onCancelEdit}
              onReply={actions.onReply}
              onOpenActions={actions.onOpenActions}
            />
          </div>
        );
      })}
      {!active && (
        <p className="text-sm text-muted-foreground">
          {starting ? "Starting conversation…" : "Select a conversation to start chatting."}
        </p>
      )}
      <div ref={endRef} />
    </div>
  );
}

/** True when this is the first message of its calendar day. */
function isDayStart(messages: Msg[], id: string): boolean {
  const idx = messages.findIndex((m) => m.id === id);
  if (idx <= 0) return true;
  const current = messages[idx];
  const previous = messages[idx - 1];
  if (!current || !previous) return true;
  return new Date(current.created_at).toDateString()
    !== new Date(previous.created_at).toDateString();
}