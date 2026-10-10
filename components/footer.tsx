import Link from "next/link";

/**
 * Minimal footer: legal links only. Every product destination is reachable via
 * the icon rail (laptops) and the bottom tab bar (phones), so repeating them
 * here was redundant. Terms/Privacy are required for Google OAuth publishing.
 */
export function Footer() {
  return (
    <footer className="mt-16 border-t bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} TranzartX. Built for emerging African artists.
        </p>
        <nav aria-label="Legal" className="flex items-center gap-4 text-xs">
          <Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms</Link>
          <Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}