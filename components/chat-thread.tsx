"use client";
import { useState } from "react";
import type { RefObject } from "react";

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

/** WhatsApp-style ticks: ✓ sent, ✓✓ delivered, blue ✓✓ read. */
function Ticks({ m }: { m: Msg }) {
  if (m.read_at) return <span className="text-sky-500">✓✓</span>;
  if (m.delivered_at) return <span className="text-muted-foreground">✓✓</span>;
  return <span className="text-muted-foreground">✓</span>;
}

interface Actions {
  onEdit: (m: Msg) => void;
  onDelete: (m: Msg) => void;
  onForward: (m: Msg) => void;
  onCopy: (m: Msg) => void;
  onSaveEdit: (id: string, body: string) => void;
  onCancelEdit: () => void;
}

/** Per-message action menu (edit / delete / forward / copy). */
function MessageActions({ m, mine, actions }: { m: Msg; mine: boolean; actions: Actions }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label="Message options"
        onClick={() => setOpen((o) => !o)}
        className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-black/10"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>
      {open && (
        <>
          <button type="button" aria-label="Close menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-20 w-40 overflow-hidden rounded-xl border bg-white py-1 shadow-lg">
            <button className="block w-full px-3 py-2 text-left text-xs hover:bg-secondary" onClick={() => { setOpen(false); actions.onCopy(m); }}>Copy text</button>
            {mine && !m.deleted_at && (
              <button className="block w-full px-3 py-2 text-left text-xs hover:bg-secondary" onClick={() => { setOpen(false); actions.onEdit(m); }}>Edit</button>
            )}
            {mine && !m.deleted_at && (
              <button className="block w-full px-3 py-2 text-left text-xs text-destructive hover:bg-secondary" onClick={() => { setOpen(false); actions.onDelete(m); }}>Delete</button>
            )}
            {!m.deleted_at && (
              <button className="block w-full px-3 py-2 text-left text-xs hover:bg-secondary" onClick={() => { setOpen(false); actions.onForward(m); }}>Forward</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface ThreadProps {
  messages: Msg[];
  myId: string | null;
  active: boolean;
  starting: boolean;
  endRef: RefObject<HTMLDivElement | null>;
  editingId: string | null;
  actions: Actions;
  lastReadAt: string | null;
}

/** Message thread: own bubbles right, theirs left. Unread arrivals are tinted. */
export function ChatThread({ messages, myId, active, starting, endRef, editingId, actions, lastReadAt }: ThreadProps) {
  const boundary = lastReadAt ? new Date(lastReadAt).getTime() : 0;
  return (
    <div className="grid gap-1.5 md:flex-1 md:overflow-y-auto">
      {messages.map((m) => {
        const mine = myId !== null && m.sender_id === myId;
        const unread = !mine && m.read_at === null;
        // Highlight only the run of messages that arrived while you were away.
        const isNew = unread && (!boundary || new Date(m.created_at).getTime() > boundary);
        return (
          <div
            key={m.id}
            className={`flex items-end gap-1 ${mine ? "justify-end" : "justify-start"} ${isNew ? "rounded-xl bg-accent/60 px-1" : ""}`}
          >
            {!mine && (
              <MessageActions m={m} mine={false} actions={actions} />
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
            >
              {m.deleted_at ? (
                <p className="italic opacity-60">This message was deleted</p>
              ) : editingId === m.id ? (
                <EditBox message={m} onSave={actions.onSaveEdit} onCancel={actions.onCancelEdit} />
              ) : (
                <>
                  {m.forwarded_from && <p className="mb-0.5 text-[10px] uppercase tracking-wide opacity-70">Forwarded</p>}
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                </>
              )}
              <span className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] leading-none ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {m.edited_at && !m.deleted_at ? "Edited · " : ""}
                {stamp(m.created_at)}
                {mine && !m.deleted_at && <Ticks m={m} />}
              </span>
            </div>
            {mine && (
              <MessageActions m={m} mine actions={actions} />
            )}
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

/** Inline edit box replacing a bubble while editing. */
function EditBox({ message, onSave, onCancel }: { message: Msg; onSave: (id: string, body: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(message.body);
  return (
    <div className="grid gap-1">
      <textarea
        autoFocus
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-lg border border-border bg-white/90 px-2 py-1 text-sm text-foreground"
      />
      <div className="flex justify-end gap-2 text-xs">
        <button
          onClick={onCancel}
          className="rounded-lg px-2 py-1 text-muted-foreground"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(message.id, value)}
          className="rounded-lg bg-primary px-2 py-1 text-white"
        >
          Save
        </button>
      </div>
    </div>
  );
}
