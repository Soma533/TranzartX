"use client";
import { useRef, useState } from "react";
import type { RefObject } from "react";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Msg } from "@/components/chat-thread";

const THRESHOLD = 60; // px of rightward drag that arms a reply
const MAX_DRAG = 88;
const HOLD_MS = 450; // press-and-hold duration that opens the action sheet

interface Handlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  style: { touchAction: "pan-y"; userSelect: "none" };
}

/**
 * Combines the two gestures on a bubble:
 *  - swipe RIGHT to reply (touch and mouse drag)
 *  - press and HOLD (or right-click) to open the action sheet
 * A hold that turns into a swipe is ignored, so the two never fight.
 */
export function useBubbleGestures(onReply: () => void, onHold: () => void) {
  const [drag, setDrag] = useState(0);
  const startX = useRef<number | null>(null);
  const timer = useRef<number | null>(null);
  const held = useRef(false);
  const replied = useRef(false);

  const clearTimer = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const handlers: Handlers = {
    onPointerDown(e) {
      if (e.button !== 0) return;
      startX.current = e.clientX;
      held.current = false;
      replied.current = false;
      // Desktop left-click should not instantly open the sheet; touch does.
      if (e.pointerType !== "mouse") {
        timer.current = window.setTimeout(() => {
          held.current = true;
          onHold();
        }, HOLD_MS);
      }
    },
    onPointerMove(e) {
      if (startX.current === null) return;
      const dx = e.clientX - startX.current;
      if (dx <= 0) {
        if (drag !== 0) setDrag(0);
        return;
      }
      // Movement means the user is swiping, not holding.
      if (held.current) return;
      if (Math.abs(dx) > 8) clearTimer();
      const next = Math.min(dx, MAX_DRAG);
      setDrag(next);
      if (next >= THRESHOLD && !replied.current) {
        replied.current = true;
        clearTimer();
        onReply();
      }
    },
    onPointerUp() {
      clearTimer();
      startX.current = null;
      if (drag !== 0) window.setTimeout(() => setDrag(0), 120);
    },
    onPointerCancel() {
      clearTimer();
      startX.current = null;
      if (drag !== 0) setDrag(0);
    },
    onContextMenu(e) {
      // Right-click is the desktop equivalent of press-and-hold.
      e.preventDefault();
      onHold();
    },
    style: { touchAction: "pan-y", userSelect: "none" }
  };

  return { drag, swiping: drag > 0, handlers };
}

/** WhatsApp-style ticks: ✓ sent, ✓✓ delivered, blue ✓✓ read. */
function Ticks({ m }: { m: Msg }) {
  if (m.read_at) return <span className="text-sky-500">✓✓</span>;
  if (m.delivered_at) return <span className="text-muted-foreground">✓✓</span>;
  return <span className="text-muted-foreground">✓</span>;
}

interface BubbleProps {
  m: Msg;
  mine: boolean;
  isNew: boolean;
  replyTo: Msg | null;
  editing: boolean;
  onSaveEdit: (id: string, body: string) => void;
  onCancelEdit: () => void;
  onReply: (m: Msg) => void;
  onOpenActions: (m: Msg) => void;
}

/** A single message bubble. No permanent dots — hold, right-click or hover. */
export function MessageBubble({ m, mine, isNew, replyTo, editing, onSaveEdit, onCancelEdit, onReply, onOpenActions }: BubbleProps) {
  const { drag, swiping, handlers } = useBubbleGestures(
    () => onReply(m),
    () => onOpenActions(m)
  );

  return (
    <div className={`group relative flex items-end ${mine ? "justify-end" : "justify-start"}`}>
      {swiping && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 flex h-7 w-7 items-center justify-center rounded-full text-primary"
          style={{ transform: `translateX(${drag - 28}px)` }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 10L4 15l5 5M4 15h11a5 5 0 0 0 5-5V4" />
          </svg>
        </span>
      )}

      {/* Desktop-only hover affordance; hidden on touch devices. */}
      <button
        type="button"
        aria-label="Message actions"
        onClick={() => onOpenActions(m)}
        className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-black/10 focus:opacity-100 group-hover:opacity-100 [@media(pointer:fine)]:inline-flex"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>

      <div
        {...handlers}
        className={`rounded-2xl px-3 py-2 text-sm transition-transform ${isNew ? "bg-accent/60" : ""}`}
        style={drag ? { transform: `translateX(${drag}px)` } : undefined}
      >
        <div
          className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
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
        className="w-full rounded-lg border border-border bg-background/90 px-2 py-1 text-sm text-foreground"
      />
      <div className="flex justify-end gap-2 text-xs">
        <button onClick={onCancel} className="rounded-lg px-2 py-1 text-muted-foreground">Cancel</button>
        <button onClick={() => onSave(message.id, value)} className="rounded-lg bg-primary px-2 py-1 text-primary-foreground">Save</button>
      </div>
    </div>
  );
}