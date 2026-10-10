"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
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
  const active = count > 0;
  return (
    <Link
      href="/notifications"
      aria-label={active ? `Notifications, ${count} unread` : "Notifications"}
      className={`relative flex h-10 w-10 items-center justify-center rounded-xl border ${active ? "text-primary" : "text-foreground"}`}
    >
      {/* Heart outline, Instagram-style activity indicator. */}
      <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20.5 4.2 13a4.6 4.6 0 0 1 0-6.6 4.9 4.9 0 0 1 7 0 4.9 4.9 0 0 1 7 0 4.6 4.6 0 0 1 0 6.6z" />
      </svg>
      {active && (
        <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-primary px-1 text-center text-[10px] font-semibold leading-[18px] text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}