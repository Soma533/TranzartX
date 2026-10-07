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
        // Opening the inbox clears the badge: mark everything read.
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
            <p className="text-sm font-medium">{n.title}</p>
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
