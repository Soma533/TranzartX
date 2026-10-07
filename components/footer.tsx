import Link from "next/link";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground">Don&apos;t just showcase your art. Build your career.</p>
        </div>
        <div>
          <p className="text-sm font-semibold">Artists</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li><Link href="/onboarding" className="hover:text-foreground">Get started</Link></li>
            <li><Link href="/today" className="hover:text-foreground">Today dashboard</Link></li>
            <li><Link href="/goals" className="hover:text-foreground">Career goals</Link></li>
            <li><Link href="/portfolio" className="hover:text-foreground">Portfolio</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Ecosystem</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li><Link href="/discover" className="hover:text-foreground">Discover art</Link></li>
            <li><Link href="/opportunities" className="hover:text-foreground">Opportunities</Link></li>
            <li><Link href="/network" className="hover:text-foreground">Network</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Account</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li><Link href="/settings" className="hover:text-foreground">Settings</Link></li>
            <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
            <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
            <li><Link href="/login" className="hover:text-foreground">Log in</Link></li>
            <li><Link href="/signup" className="hover:text-foreground">Join</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} TranzartX. Built for emerging African artists.</div>
    </footer>
  );
}
