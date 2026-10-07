"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const { push } = useToast();
  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications").then((r) => r.json()).then((j) => {
      if (cancelled) return;
      const unread = (j.notifications ?? []).filter((n: { read_at: string | null }) => !n.read_at).length;
      setCount(unread);
    }).catch(() => null);
    const supabase = createClient();
    // Unique per instance: navbar renders desktop + mobile bells at once.
    // Reusing the same channel name throws "cannot add callbacks after subscribe()".
    const channelName = `notifications-${Math.random().toString(36).slice(2)}`;
    const ch = supabase.channel(channelName)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        const n = payload.new as { title: string };
        setCount((c) => c + 1);
        push(n.title);
      })
      .subscribe();
    return () => {
      cancelled = true;
      void supabase.removeChannel(ch);
    };
  }, [push]);
  return (
    <a href="/notifications" className="relative rounded-xl border px-3 py-1.5 text-sm">
      🔔{count > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-xs text-white">{count}</span>}
    </a>
  );
}
