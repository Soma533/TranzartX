"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

export default function NotificationsPage() {
  const [items, setItems] = useState<{ id: string; title: string; body: string | null }[]>([]);
  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then((j) => setItems(j.notifications ?? [])).catch(() => null);
  }, []);
  return (
    <div className="grid gap-3">
      <h1 className="text-2xl font-bold">Notifications</h1>
      {items.map((n) => (
        <Card key={n.id}><p className="text-sm font-medium">{n.title}</p>{n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}</Card>
      ))}
      {items.length === 0 && <p className="text-sm text-muted-foreground">Actionable events land here: matches, saves, deadlines, connections.</p>}
    </div>
  );
}
