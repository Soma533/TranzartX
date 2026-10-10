"use client";

/**
 * Minimal line-icon set drawn to one 24px grid so the mobile tab bar reads as a
 * single family (Instagram-style outline icons, 1.8 stroke).
 */
type IconProps = { className?: string };

const base = "h-6 w-6";

export function HomeIcon({ className = base }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9.6V20h13V9.6" />
      <path d="M9.8 20v-5.4h4.4V20" />
    </svg>
  );
}

export function CompassIcon({ className = base }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="m15.4 8.6-2 4.8-4.8 2 2-4.8z" />
    </svg>
  );
}

export function MessageIcon({ className = base }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a7.5 6.5 0 0 1-7.5 6.5 8.2 8.2 0 0 1-2.7-.5L5 20l1.6-3.6A6.4 6.4 0 0 1 6 11.5 7.5 6.5 0 0 1 13.5 5 7.5 6.5 0 0 1 21 11.5z" />
    </svg>
  );
}

export function BriefcaseIcon({ className = base }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7.5" width="18" height="12" rx="2.5" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3 12.5h18" />
    </svg>
  );
}

export function GearIcon({ className = base }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

export function HeartIcon({ className = base }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20.5 4.2 13a4.6 4.6 0 0 1 0-6.6 4.9 4.9 0 0 1 7 0 4.9 4.9 0 0 1 7 0 4.6 4.6 0 0 1 0 6.6z" />
    </svg>
  );
}