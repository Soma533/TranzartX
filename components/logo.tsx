export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true" className="rounded-lg">
        <defs>
          <linearGradient id="txg-nav" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#9a3412" />
            <stop offset="1" stopColor="#c2410c" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="15" fill="url(#txg-nav)" />
        <text x="32" y="41.5" fontFamily="Arial, Helvetica, sans-serif" fontSize="26" fontWeight="bold" fill="#fff" textAnchor="middle">TX</text>
      </svg>
      {!compact && (
        <span className="text-lg font-extrabold tracking-tight">
          Tranzart<span className="text-primary">X</span>
        </span>
      )}
    </span>
  );
}
