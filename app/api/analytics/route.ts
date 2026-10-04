import { requireUser } from "@/services/auth-guard";
import { apiError } from "@/lib/logger";

export async function GET() {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  try {
    const [{ count: artCount }, { count: followerCount }, { count: connectionCount }, { count: saveCount }, { data: events }] = await Promise.all([
      supabase.from("artworks").select("id", { count: "exact", head: true }).eq("artist_id", profileId ?? ""),
      supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", profileId ?? ""),
      supabase.from("connections").select("id", { count: "exact", head: true }).or(`requester_id.eq.${profileId ?? ""},receiver_id.eq.${profileId ?? ""}`),
      supabase.from("saved_artworks").select("artwork_id", { count: "exact", head: true }).eq("collector_id", profileId ?? ""),
      supabase.from("analytics_events").select("event").eq("actor_id", profileId ?? "").limit(500)
    ]);
    const counts: Record<string, number> = {};
    for (const e of (events as { event: string }[] | null) ?? []) counts[e.event] = (counts[e.event] ?? 0) + 1;
    return Response.json({
      artworks: artCount ?? 0,
      followers: followerCount ?? 0,
      connections: connectionCount ?? 0,
      saves: saveCount ?? 0,
      profileViews: counts["profile_view"] ?? 0,
      artworkViews: counts["artwork_view"] ?? 0,
      inquiries: counts["inquiry"] ?? 0,
      uploads: counts["artwork_upload"] ?? 0
    });
  } catch (err) {
    return apiError("ANALYTICS", err instanceof Error ? err.message : "failed", 500);
  }
}
