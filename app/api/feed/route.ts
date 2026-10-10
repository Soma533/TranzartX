import { requireUser } from "@/services/auth-guard";
import { apiError } from "@/lib/logger";

/**
 * Home feed for signed-in users: recent work and opportunities from *other*
 * people, newest first (PRD §7). Own items are excluded so the landing page
 * surfaces the network rather than your own catalogue.
 */
export async function GET() {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;

  try {
    const [artworks, opportunities] = await Promise.all([
      supabase
        .from("artworks")
        .select("id,title,image_url,medium,price_cents,currency,availability,created_at,artist_id,profiles!artworks_artist_id_fkey(id,name,avatar_url)")
        .neq("artist_id", profileId ?? "00000000-0000-0000-0000-000000000000")
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("opportunities")
        .select("id,title,type,location,deadline,created_at,org_id,profiles!opportunities_org_id_fkey(id,name,avatar_url)")
        .neq("org_id", profileId ?? "00000000-0000-0000-0000-000000000000")
        .order("created_at", { ascending: false })
        .limit(6)
    ]);

    if (artworks.error) throw artworks.error;
    if (opportunities.error) throw opportunities.error;
    return Response.json({ artworks: artworks.data ?? [], opportunities: opportunities.data ?? [] });
  } catch (err) {
    return apiError("FEED", err instanceof Error ? err.message : "failed", 500);
  }
}