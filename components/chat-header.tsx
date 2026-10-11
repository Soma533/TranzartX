"use client";
import { Avatar, type Conversation } from "@/components/conversation-list";
import { lastSeenLabel } from "@/components/chat-thread";

/** Conversation header: back button (phones), avatar, name and presence. */
export function ChatHeader({ peer, isOnline, onBack }: {
  peer: Conversation["with"];
  isOnline: boolean;
  onBack: () => void;
}) {
  return (
    <header className="flex items-center gap-3 border-b px-3 py-2.5">
      <button
        onClick={onBack}
        aria-label="Back to conversations"
        className="rounded-lg p-1 hover:bg-secondary md:hidden"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <Avatar person={peer} size={10} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{peer?.name ?? "Conversation"}</p>
        <p className={`truncate text-xs ${isOnline ? "text-primary" : "text-muted-foreground"}`}>
          {lastSeenLabel(peer?.last_seen_at, isOnline)}
        </p>
      </div>
    </header>
  );
}