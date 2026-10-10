"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, CompassIcon, MessageIcon, BriefcaseIcon, GearIcon } from "@/components/icons";

/**
 * Instagram-style bottom tab bar, phones only. The five core destinations live
 * here as icons with labels; the rest stay in the navbar menu (PRD §7).
 */
const tabs = [
  { href: "/today", label: "Today", Icon: HomeIcon },
  { href: "/discover", label: "Discover", Icon: CompassIcon },
  { href: "/messages", label: "Messages", Icon: MessageIcon },
  { href: "/opportunities", label: "Opportunities", Icon: BriefcaseIcon },
  { href: "/settings", label: "Settings", Icon: GearIcon }
];

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {tabs.map(({ href, label, Icon }) => {
          const current = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] ${current ? "text-foreground" : "text-muted-foreground"}`}
              >
                <Icon className={`h-6 w-6 ${current ? "stroke-[2.4]" : ""}`} />
                <span className="max-w-full truncate">{label}</span>
                {/* Active indicator bar, mirroring the Instagram tab underline. */}
                <span className={`h-0.5 w-8 rounded-full ${current ? "bg-foreground" : "bg-transparent"}`} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}