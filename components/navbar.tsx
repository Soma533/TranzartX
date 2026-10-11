"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { HeartIcon } from "@/components/icons";
import { MENU_ITEMS } from "@/components/nav-items";
import { NotificationBell } from "@/components/notification-bell";
import { InstallButton } from "@/components/install-button";
import { createClient } from "@/lib/supabase/client";

/** Phones: the five core destinations live in the bottom tab bar, not the menu. */
const menuLinks = MENU_ITEMS;

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
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        {/* Instagram-style hamburger, far left on phones. */}
        <button
          className="-ml-1 rounded-xl p-2 hover:bg-secondary lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />}
          </svg>
        </button>
        <Link href="/" aria-label="TranzartX home"><Logo /></Link>
        {/* Laptops navigate via the left icon rail, so no text links here. */}
        <div className="ml-auto flex items-center gap-2 text-sm">
          <InstallButton compact />
          {account !== false && <NotificationBell />}
          <div className="hidden items-center gap-2 lg:flex">
            <Link href="/profile" onClick={() => setOpen(false)} className="rounded-xl border px-3 py-1.5">Profile</Link>
            {account === null ? (
              <span className="px-3 py-1.5 text-muted-foreground">…</span>
            ) : authed ? (
              <button onClick={signOut} className="rounded-xl border px-3 py-1.5">Sign out</button>
            ) : (
              <>
                <Link href="/login" className="rounded-xl border px-3 py-1.5">Log in</Link>
                <Link href="/signup" className="rounded-xl bg-primary px-3 py-1.5 text-primary-foreground">Join</Link>
              </>
            )}
          </div>
        </div>
      </div>
      {open && (
        <nav aria-label="Primary" className="grid gap-1 border-t px-4 py-3 text-sm lg:hidden">
          {account !== false && (
            <Link href="/notifications" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 font-medium text-foreground hover:bg-secondary">
              <HeartIcon className="h-5 w-5" />
              Notifications
            </Link>
          )}
          {menuLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
              {l.label}
            </Link>
          ))}
          <div className="mt-1 flex gap-2">
            {authed ? (
              <button onClick={signOut} className="rounded-xl border px-3 py-1.5">Sign out</button>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl border px-3 py-1.5">Log in</Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="rounded-xl bg-primary px-3 py-1.5 text-primary-foreground">Join</Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
