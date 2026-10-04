import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md rounded-3xl border bg-white p-10 text-center">
      <p className="text-sm uppercase tracking-widest text-primary">TranzartX</p>
      <h2 className="mt-2 text-2xl font-bold">This page is off the canvas</h2>
      <p className="mt-2 text-sm text-muted-foreground">The page you asked for doesn&apos;t exist or was moved.</p>
      <Link href="/" className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm text-white">Back home</Link>
    </div>
  );
}
