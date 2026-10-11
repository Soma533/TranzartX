"use client";
import { useState } from "react";
import { useSwipeReply } from "@/hooks/use-swipe-reply";
import type { Msg } from "@/components/chat-thread";

/** WhatsApp-style ticks: ✓ sent, ✓✓ delivered, blue ✓✓ read. */
function Ticks({ m }: { m: Msg }) {
  if (m.read_at) return <span className="text-sky-500">✓✓</span>;
  if (m.delivered_at) return <span className="text-muted-foreground">✓✓</span>;
  return <span className="text-muted-foreground">✓</span>;
}

/** Per-message action menu: copy / reply / edit / delete / forward. */
function MessageActions({ m, mine, actions }: {
  m: Msg;
  mine: boolean;
  actions: {
    onReply: (m: Msg) => void;
    onEdit: (m: Msg) => void;
    onDelete: (m: Msg) => void;
    onForward: (m: Msg) => void;
    onCopy: (m: Msg) => void;
  };
}) {
  const [open, setOpen] = useState(false);
  const item = "block w-full px-3 py-2 text-left text-xs hover:bg-secondary";
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
            <button className={item} onClick={() => { setOpen(false); actions.onCopy(m); }}>Copy text</button>
            {!m.deleted_at && (
              <button className={item} onClick={() => { setOpen(false); actions.onReply(m); }}>Reply</button>
            )}
            {mine && !m.deleted_at && (
              <button className={item} onClick={() => { setOpen(false); actions.onEdit(m); }}>Edit</button>
            )}
            {mine && !m.deleted_at && (
              <button className={`${item} text-destructive`} onClick={() => { setOpen(false); actions.onDelete(m); }}>Delete</button>
            )}
            {!m.deleted_at && (
              <button className={item} onClick={() => { setOpen(false); actions.onForward(m); }}>Forward</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface BubbleProps {
  m: Msg;
  mine: boolean;
  isNew: boolean;
  replyTo: Msg | null;
  editing: boolean;
  onSaveEdit: (id: string, body: string) => void;
  onCancelEdit: () => void;
  actions: Parameters<typeof MessageActions>[0]["actions"];
}

/** A single message bubble: swipe right (or use the ⋮ menu) to reply. */
export function MessageBubble({ m, mine, isNew, replyTo, editing, onSaveEdit, onCancelEdit, actions }: BubbleProps) {
  const swipe = useSwipeReply(() => actions.onReply(m));

  return (
    <div className={`relative flex items-end gap-1 ${mine ? "justify-end" : "justify-start"}`}>
      {/* Reply arrow revealed behind the bubble while dragging right. */}
      {swipe.swiping && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 flex h-7 w-7 items-center justify-center rounded-full text-primary"
          style={{ transform: `translateX(${swipe.drag - 28}px)` }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 10L4 15l5 5M4 15h11a5 5 0 0 0 5-5V4" />
          </svg>
        </span>
      )}

      <div
        {...swipe.handlers}
        className={`flex items-end gap-1 ${isNew ? "rounded-xl bg-accent/60 px-1" : ""}`}
      >
        {!mine && <MessageActions m={m} mine={false} actions={actions} />}

        <div
          className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm transition-transform ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
          style={swipe.drag ? { transform: `translateX(${swipe.drag}px)` } : undefined}
        >
          {m.deleted_at ? (
            <p className="italic opacity-60">This message was deleted</p>
          ) : editing ? (
            <EditBox message={m} onSave={onSaveEdit} onCancel={onCancelEdit} />
          ) : (
            <>
              {replyTo && !m.deleted_at && (
                <p className={`mb-1 truncate border-l-2 pl-2 text-[11px] ${mine ? "border-primary-foreground/60 opacity-80" : "border-primary/60 text-muted-foreground"}`}>
                  {replyTo.deleted_at ? "Deleted message" : replyTo.body.slice(0, 80)}
                </p>
              )}
              {m.forwarded_from && <p className="mb-0.5 text-[10px] uppercase tracking-wide opacity-70">Forwarded</p>}
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
            </>
          )}
          <span className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] leading-none ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {m.edited_at && !m.deleted_at ? "Edited · " : ""}
            {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {mine && !m.deleted_at && <Ticks m={m} />}
          </span>
        </div>

        {mine && <MessageActions m={m} mine actions={actions} />}
      </div>
    </div>
  );
}

/** Inline edit box replacing a bubble while editing. */
function EditBox({ message, onSave, onCancel }: {
  message: Msg;
  onSave: (id: string, body: string) => void;
  onCancel: () => void;
}) {
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
        <button onClick={onCancel} className="rounded-lg px-2 py-1 text-muted-foreground">Cancel</button>
        <button onClick={() => onSave(message.id, value)} className="rounded-lg bg-primary px-2 py-1 text-white">Save</button>
      </div>
    </div>
  );
}