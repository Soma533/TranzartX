"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  actor_id: string | null;
  read_at: string | null;
  created_at: string;
}

/** "2 min ago", "Yesterday 14:05", or a date for older items. */
function timeAgo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}

export default function NotificationsPage() {
  const { push } = useToast();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((j) => setItems(j.notifications ?? []))
      .catch(() => null)
      .finally(() => {
        // Opening the inbox clears the badge immediately.
        setItems((list) => list.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
        window.dispatchEvent(new Event("notifications:read"));
        fetch("/api/notifications", { method: "PATCH" }).catch(() => null);
      });
  }, []);

  async function followBack(targetId: string) {
    setBusy(targetId);
    try {
      const r = await fetch("/api/network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "follow", targetId })
      });
      if (r.ok) {
        setFollowed((s) => new Set(s).add(targetId));
        push("Following back");
      } else {
        const j = await r.json().catch(() => null);
        push(j?.error?.message ?? "Follow failed");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-3">
      <h1 className="text-2xl font-bold">Notifications</h1>
      {items.map((n) => {
        const isFollow = n.type === "follow" && n.actor_id;
        const isMessage = n.type === "message" && n.actor_id;
        const done = n.actor_id ? followed.has(n.actor_id) : false;
        return (
          <Card key={n.id} className={n.read_at ? "opacity-70" : ""}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium">{n.title}</p>
              <time
                dateTime={n.created_at}
                title={new Date(n.created_at).toLocaleString()}
                className="shrink-0 text-[11px] text-muted-foreground"
              >
                {timeAgo(n.created_at)}
              </time>
            </div>
            {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
            <div className="mt-2 flex gap-2">
              {isFollow && n.actor_id && (
                done ? (
                  <Button variant="outline" disabled>Following ✓</Button>
                ) : (
                  <Button variant="secondary" disabled={busy === n.actor_id} onClick={() => followBack(n.actor_id as string)}>
                    {busy === n.actor_id ? "…" : "Follow back"}
                  </Button>
                )
              )}
              {isMessage && n.actor_id && (
                <Link href={`/messages?to=${n.actor_id}`} className="inline-flex items-center rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">Reply</Link>
              )}
              {n.link && (
                <Link href={n.link} className="inline-flex items-center px-2 py-2 text-sm text-primary hover:underline">View</Link>
              )}
            </div>
          </Card>
        );
      })}
      {items.length === 0 && <p className="text-sm text-muted-foreground">Actionable events land here: matches, saves, deadlines, connections.</p>}
    </div>
  );
}
