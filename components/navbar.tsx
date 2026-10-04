"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { NotificationBell } from "@/components/notification-bell";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/today", label: "Today" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/tracking", label: "Tracking" },
  { href: "/network", label: "Network" },
  { href: "/messages", label: "Messages" },
  { href: "/inquiries", label: "Inquiries" },
  { href: "/assistant", label: "Assistant" },
  { href: "/discover", label: "Discover" }
];

export function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // null = unknown yet, string email = signed in, false = signed out.
  const [account, setAccount] = useState<string | false | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setAccount(data.session?.user.email ?? false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccount(session?.user.email ?? false);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  async function signOut() {
    await createClient().auth.signOut();
    setOpen(false);
    router.replace("/");
  }

  const authed = typeof account === "string";

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" aria-label="TranzartX home"><Logo /></Link>
        <nav className="hidden gap-4 text-sm lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 text-sm lg:flex">
          {authed && <NotificationBell />}
          <Link href="/settings" className="rounded-xl border px-3 py-1.5">Settings</Link>
          {account === null ? (
            <span className="px-3 py-1.5 text-muted-foreground">…</span>
          ) : authed ? (
            <button onClick={signOut} className="rounded-xl border px-3 py-1.5">Sign out</button>
          ) : (
            <>
              <Link href="/login" className="rounded-xl border px-3 py-1.5">Log in</Link>
              <Link href="/signup" className="rounded-xl bg-primary px-3 py-1.5 text-white">Join</Link>
            </>
          )}
        </div>
        <button className="rounded-xl border px-3 py-1.5 text-sm lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu">
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <nav className="grid gap-1 border-t px-4 py-3 text-sm lg:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
              {l.label}
            </Link>
          ))}
          <div className="mt-1 flex gap-2">
            <Link href="/settings" onClick={() => setOpen(false)} className="rounded-xl border px-3 py-1.5">Settings</Link>
            {authed ? (
              <button onClick={signOut} className="rounded-xl border px-3 py-1.5">Sign out</button>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl border px-3 py-1.5">Log in</Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="rounded-xl bg-primary px-3 py-1.5 text-white">Join</Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
