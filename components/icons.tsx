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

export function FrameIcon({ className = base }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="m3 15.5 4.6-4.3a2 2 0 0 1 2.7 0L15 15.4M13.5 14l1.9-1.8a2 2 0 0 1 2.7 0L21 14.8" />
      <circle cx="8.8" cy="8.8" r="1.4" />
    </svg>
  );
}

export function FlagIcon({ className = base }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 21V4M5.5 4.8h9l-1.3 3.4 1.3 3.4h-9" />
    </svg>
  );
}

export function UsersIcon({ className = base }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.8 19.5a6.4 6.4 0 0 1 12.4 0M16.2 5.2a3.2 3.2 0 0 1 0 5.9M17.6 14.4a5.4 5.4 0 0 1 3.6 5.1" />
    </svg>
  );
}

export function MailIcon({ className = base }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.8" y="5" width="18.4" height="14" rx="2.5" />
      <path d="m3.6 7 7.3 5.2a2 2 0 0 0 2.2 0L20.4 7" />
    </svg>
  );
}

export function SparkIcon({ className = base }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9z" />
      <path d="M18.5 16.5 19.2 18.6l2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7z" />
    </svg>
  );
}

export function ArtIcon({ className = base }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="9.5" r="1.3" />
      <circle cx="15.5" cy="10" r="1.3" />
      <path d="m7.5 17.5 3.4-4.4a2 2 0 0 1 3.1 0l2.4 3.1M15 15.5l1.4-1.4a2 2 0 0 1 2.6.3" />
    </svg>
  );
}