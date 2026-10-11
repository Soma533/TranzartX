"use client";
import { listStamp } from "@/components/chat-thread";

export interface Conversation {
  conversation_id: string;
  with?: { id: string; name: string; avatar_url?: string | null; last_seen_at?: string | null } | null;
  last_message?: { body: string; created_at: string; mine: boolean } | null;
  unread?: number;
  last_read_at?: string | null;
}

function Avatar({ person, size = 12 }: { person: Conversation["with"]; size?: number }) {
  if (person?.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={person.avatar_url} alt="" className={`h-${size} w-${size} shrink-0 rounded-full object-cover`} style={{ height: size * 4, width: size * 4 }} />;
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-muted-foreground"
      style={{ height: size * 4, width: size * 4 }}
    >
      {(person?.name ?? "?").slice(0, 1)}
    </span>
  );
}

/**
 * Instagram-style thread list: avatar, name, last-message preview, timestamp
 * and an unread badge. Sorted newest-first by the API.
 */
export function ConversationList({ items, active, onSelect }: {
  items: Conversation[];
  active: string | null;
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">No conversations yet — find people on the Network tab.</p>;
  }
  return (
    <ul className="divide-y">
      {items.map((c) => {
        const unread = (c.unread ?? 0) > 0;
        const current = c.conversation_id === active;
        return (
          <li key={c.conversation_id}>
            <button
              onClick={() => onSelect(c.conversation_id)}
              aria-current={current ? "true" : undefined}
              className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${current ? "bg-secondary" : "hover:bg-secondary/60"}`}
            >
              <Avatar person={c.with} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={`truncate text-sm ${unread ? "font-bold" : "font-semibold"}`}>
                    {c.with?.name ?? "Unknown member"}
                  </span>
                  <span className={`shrink-0 text-[11px] ${unread ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                    {listStamp(c.last_message?.created_at ?? null)}
                  </span>
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <span className={`truncate text-xs ${unread ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                    {c.last_message ? `${c.last_message.mine ? "You: " : ""}${c.last_message.body}` : "Say hello 👋"}
                  </span>
                  {unread && (
                    <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                      {c.unread}
                    </span>
                  )}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export { Avatar };