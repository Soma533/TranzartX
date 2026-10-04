"use client";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border bg-white p-10 text-center">
      <p className="text-sm uppercase tracking-widest text-primary">TranzartX</p>
      <h2 className="mt-2 text-2xl font-bold">Something smudged</h2>
      <p className="mt-2 text-sm text-muted-foreground">{error.message || "An unexpected error occurred."}</p>
      <button onClick={reset} className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm text-white">Try again</button>
    </div>
  );
}
