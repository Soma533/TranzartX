"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const { push } = useToast();
  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then((j) => {
      const unread = (j.notifications ?? []).filter((n: { read_at: string | null }) => !n.read_at).length;
      setCount(unread);
    }).catch(() => null);
    const supabase = createClient();
    const ch = supabase.channel("notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        const n = payload.new as { title: string };
        setCount((c) => c + 1);
        push(n.title);
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [push]);
  return (
    <a href="/notifications" className="relative rounded-xl border px-3 py-1.5 text-sm">
      🔔{count > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-xs text-white">{count}</span>}
    </a>
  );
}
