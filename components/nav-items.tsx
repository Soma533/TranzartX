"use client";
import {
  HomeIcon, CompassIcon, MessageIcon, BriefcaseIcon, GearIcon,
  FrameIcon, FlagIcon, UsersIcon, MailIcon, SparkIcon
} from "@/components/icons";

type IconType = (props: { className?: string }) => React.JSX.Element;

/** Every destination in the product, with its outline icon (PRD §7). */
export const NAV_ITEMS: { href: string; label: string; Icon: IconType }[] = [
  { href: "/today", label: "Today", Icon: HomeIcon },
  { href: "/discover", label: "Discover", Icon: CompassIcon },
  { href: "/portfolio", label: "Portfolio", Icon: FrameIcon },
  { href: "/opportunities", label: "Opportunities", Icon: BriefcaseIcon },
  { href: "/tracking", label: "Tracking", Icon: FlagIcon },
  { href: "/network", label: "Network", Icon: UsersIcon },
  { href: "/messages", label: "Messages", Icon: MessageIcon },
  { href: "/inquiries", label: "Inquiries", Icon: MailIcon },
  { href: "/assistant", label: "Assistant", Icon: SparkIcon },
  { href: "/settings", label: "Settings", Icon: GearIcon }
];

/** Phone tab bar and laptop sidebar both surface these five. */
export const CORE_HREFS = new Set(["/today", "/discover", "/messages", "/opportunities", "/settings"]);

export const CORE_ITEMS = NAV_ITEMS.filter((i) => CORE_HREFS.has(i.href));
export const MENU_ITEMS = NAV_ITEMS.filter((i) => !CORE_HREFS.has(i.href));