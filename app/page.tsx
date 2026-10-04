import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="grid gap-6">
      <section className="rounded-3xl bg-gradient-to-br from-orange-600 to-amber-500 p-10 text-white">
        <p className="text-sm uppercase tracking-widest opacity-80">TranzartX</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-bold leading-tight">
          Don&apos;t just showcase your art. Build your career.
        </h1>
        <p className="mt-3 max-w-xl text-white/90">
          Portfolio, marketplace, opportunities, and professional network for emerging African artists.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/signup"><Button variant="secondary">Join as artist</Button></Link>
          <Link href="/discover"><Button variant="outline">Discover art</Button></Link>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { t: "Career + Commerce + Community", d: "Goal → recommendations → action → connection → income." },
          { t: "Today dashboard", d: "What matters today: next step, matches, people, activity." },
          { t: "Trust", d: "Verified vs self-reported professional information." }
        ].map((c) => (
          <Card key={c.t}><CardTitle>{c.t}</CardTitle><p className="mt-2 text-sm text-muted-foreground">{c.d}</p></Card>
        ))}
      </div>
    </div>
  );
}
