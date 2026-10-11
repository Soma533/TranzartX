"use client";
import type { Msg } from "@/components/chat-thread";

interface SheetProps {
  message: Msg | null;
  mine: boolean;
  busy: boolean;
  onReply: (m: Msg) => void;
  onCopy: (m: Msg) => void;
  onEdit: (m: Msg) => void;
  onDelete: (m: Msg) => void;
  onForward: (m: Msg) => void;
  onClose: () => void;
}

/**
 * Instagram-style action sheet. Reached by press-and-hold on a bubble (touch),
 * right-click, or the hover affordance on desktop. A centred sheet avoids the
 * off-screen dropdown problem that made Reply unreachable on received messages.
 */
export function MessageActionsSheet({ message, mine, busy, onReply, onCopy, onEdit, onDelete, onForward, onClose }: SheetProps) {
  if (!message) return null;
  const item = "flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-secondary disabled:opacity-50";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Message actions"
      >
        <p className="truncate border-b px-4 py-2 text-xs italic text-muted-foreground">
          {message.deleted_at ? "Deleted message" : message.body.slice(0, 120)}
        </p>
        <button className={item} onClick={() => onReply(message)}>
          <span aria-hidden>↩</span> Reply
        </button>
        <button className={item} onClick={() => onCopy(message)}>
          <span aria-hidden>⧉</span> Copy text
        </button>
        {!message.deleted_at && (
          <button className={item} onClick={() => onForward(message)}>
            <span aria-hidden>→</span> Forward
          </button>
        )}
        {mine && !message.deleted_at && (
          <button className={item} onClick={() => onEdit(message)}>
            <span aria-hidden>✎</span> Edit
          </button>
        )}
        {mine && !message.deleted_at && (
          <button className={`${item} text-destructive`} disabled={busy} onClick={() => onDelete(message)}>
            <span aria-hidden>🗑</span> Delete
          </button>
        )}
        <button className="w-full border-t px-4 py-3 text-sm text-muted-foreground hover:bg-secondary" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}