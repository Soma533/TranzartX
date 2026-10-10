import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { ArtworkFeed, OpportunityFeed } from "@/components/feed";
import { getSessionUser } from "@/lib/supabase/server";
import { CompassIcon, ArtIcon } from "@/components/icons";

/**
 * Signed-in visitors land straight on the community feed; everyone else sees the
 * marketing hero with the join/discover calls to action (PRD §7).
 */
export default async function Home() {
  let signedIn = false;
  try {
    const { user } = await getSessionUser();
    signedIn = Boolean(user);
  } catch {
    signedIn = false;
  }

  if (signedIn) {
    return (
      <div className="grid gap-6">
        <section>
          <h1 className="text-2xl font-bold">From the community</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Newest work and opportunities shared by other artists, galleries and collectors.
          </p>
        </section>
        <ArtworkFeed />
        <section>
          <h2 className="mb-3 text-lg font-semibold">Fresh opportunities</h2>
          <OpportunityFeed />
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl bg-gradient-to-br from-orange-600 to-amber-500 p-6 text-white sm:p-10">
        <p className="text-sm uppercase tracking-widest opacity-80">TranzartX</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
          Don&apos;t just showcase your art. Build your career.
        </h1>
        <p className="mt-3 max-w-xl text-white/90">
          Portfolio, marketplace, opportunities, and professional network for emerging African artists.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/signup" className="rounded-xl border border-transparent bg-white px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50">
            Join as artist
          </Link>
          <Link href="/discover" className="inline-flex items-center gap-2 rounded-xl border border-white/70 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">
            <CompassIcon className="h-4 w-4" />
            Discover art
          </Link>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { t: "Career + Commerce + Community", d: "Goal → recommendations → action → connection → income.", Icon: CompassIcon },
          { t: "Today dashboard", d: "What matters today: next step, matches, people, activity.", Icon: ArtIcon },
          { t: "Trust", d: "Verified vs self-reported professional information.", Icon: CompassIcon }
        ].map((c) => (
          <Card key={c.t}>
            <CardTitle>{c.t}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}