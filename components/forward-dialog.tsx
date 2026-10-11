"use client";
import { Avatar, type Conversation } from "@/components/conversation-list";
import type { Msg } from "@/components/chat-thread";

/** Pick who to forward a message to. */
export function ForwardDialog({ message, people, onPick, onClose }: {
  message: Msg;
  people: Conversation[];
  onPick: (profileId: string) => void;
  onClose: () => void;
}) {
  const targets = people.filter((c) => c.with);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Forward message">
        <p className="border-b px-4 py-3 text-sm font-semibold">Forward to…</p>
        <p className="max-h-24 overflow-y-auto bg-secondary/60 px-4 py-2 text-xs italic text-muted-foreground">
          “{message.body.slice(0, 120)}{message.body.length > 120 ? "…" : ""}”
        </p>
        <ul className="max-h-64 overflow-y-auto">
          {targets.map((c) => (
            <li key={c.conversation_id}>
              <button
                onClick={() => onPick(c.with!.id)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-secondary"
              >
                <Avatar person={c.with} size={9} />
                <span className="truncate">{c.with!.name}</span>
              </button>
            </li>
          ))}
          {targets.length === 0 && (
            <li className="px-4 py-3 text-xs text-muted-foreground">Start a conversation first, then forward.</li>
          )}
        </ul>
        <button onClick={onClose} className="w-full border-t px-4 py-2.5 text-sm text-muted-foreground hover:bg-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}