"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/nav-items";

/**
 * Instagram-style left icon rail for laptops and desktops. Phones use
 * MobileTabBar instead, so this is hidden below the lg breakpoint.
 */
export function DesktopSidebar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="hidden w-56 shrink-0 border-r border-border pr-4 lg:block"
    >
      <ul className="sticky top-24 grid gap-0.5">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const current = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${current ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
              >
                <Icon className={`h-6 w-6 shrink-0 ${current ? "stroke-[2.4]" : ""}`} />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}