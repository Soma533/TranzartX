"use client";
import type { Msg } from "@/components/chat-thread";

/** Shows which message the next send will reply to, with a way to cancel. */
export function ReplyBar({ target, onCancel }: { target: Msg | null; onCancel: () => void }) {
  if (!target) return null;
  return (
    <div className="flex items-center gap-2 border-l-2 border-primary bg-secondary/70 px-3 py-1.5 text-xs">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-primary">Replying to</p>
        <p className="truncate text-muted-foreground">{target.body}</p>
      </div>
      <button onClick={onCancel} aria-label="Cancel reply" className="rounded-full p-1 hover:bg-muted">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}