import { Card, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { scoreCompleteness } from "@/services/domain.service";

/** Public artist profile — professional home (PRD §9). Reads via public RLS, no login required. */
export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const [{ data: profile }, { data: artworks }, { data: goals }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("artworks").select("id,title,image_url,price_cents,currency,availability").eq("artist_id", id).order("created_at", { ascending: false }).limit(24),
    supabase.from("career_goals").select("goal_type,is_primary").eq("profile_id", id).limit(5)
  ]);
  if (!profile) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <h1 className="text-xl font-bold">Artist not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">This profile does not exist or is not public yet.</p>
      </div>
    );
  }
  const p = profile as {
    name: string; bio: string | null; statement: string | null; short_desc: string | null;
    location_city: string | null; location_country: string | null; avatar_url: string | null;
    disciplines: string[]; mediums: string[]; is_verified: boolean; commission_open: boolean;
    career_stage: string | null;
  };
  const arts = (artworks as { id: string; title: string; image_url: string; price_cents: number | null; currency: string }[] | null) ?? [];
  const { pct, tips } = scoreCompleteness({ ...p, artworkCount: arts.length, hasPrice: arts.some((a) => a.price_cents) });

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex items-center gap-4">
          {p.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.avatar_url} alt={p.name} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-xl font-bold">{p.name.slice(0, 1)}</div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{p.name} {p.is_verified ? "✓" : null}</h1>
            <p className="text-sm text-muted-foreground">
              {[p.location_city, p.location_country].filter(Boolean).join(", ") || "Location not set"}
              {p.is_verified ? " · Verified" : " · Self-reported"}
            </p>
            {p.short_desc && <p className="mt-1 text-sm">{p.short_desc}</p>}
          </div>
        </div>
        <p className="mt-3 text-sm">Profile health: {pct}% complete</p>
        {tips.length > 0 && <p className="mt-1 text-xs text-muted-foreground">Missing: {tips.slice(0, 3).join(" · ")}</p>}
        {p.commission_open && <p className="mt-2 text-sm font-medium text-primary">Open to commissions & collaborations</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/messages?to=${id}`} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white">Message</Link>
          <Link href="/opportunities" className="rounded-xl border px-4 py-2 text-sm font-medium">View opportunities</Link>
        </div>
      </div>
      {p.bio && <Card><CardTitle>Biography</CardTitle><p className="mt-1 text-sm">{p.bio}</p></Card>}
      {p.statement && <Card><CardTitle>Artist statement</CardTitle><p className="mt-1 text-sm">{p.statement}</p></Card>}
      <Card>
        <CardTitle>Portfolio ({arts.length})</CardTitle>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {arts.map((a) => (
            <a key={a.id} href={`/artworks/${a.id}`} className="rounded-xl border p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.image_url} alt={a.title} className="h-40 w-full rounded-lg object-cover" />
              <p className="mt-1 text-sm font-medium">{a.title}</p>
            </a>
          ))}
          {arts.length === 0 && <p className="text-sm text-muted-foreground">No public artworks yet.</p>}
        </div>
      </Card>
      <Card>
        <CardTitle>Career goals</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          {(goals as { goal_type: string }[] | null)?.map((g) => g.goal_type.replaceAll("_", " ")).join(" · ") || "No public goals yet."}
        </p>
      </Card>
    </div>
  );
}
