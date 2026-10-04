export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true" className="rounded-lg">
        <rect width="64" height="64" rx="14" fill="#c2410c" />
        <text x="32" y="42" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="bold" fill="#fff" textAnchor="middle">TX</text>
      </svg>
      {!compact && (
        <span className="text-lg font-extrabold tracking-tight">
          Tranzart<span className="text-primary">X</span>
        </span>
      )}
    </span>
  );
}
