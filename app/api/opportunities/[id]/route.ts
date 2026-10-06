import { requireUser } from "@/services/auth-guard";
import { matchReasons } from "@/services/domain.service";
import { apiError } from "@/lib/logger";

/** Single opportunity with match explanation + publisher (PRD §15–17). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const { data: opp } = await supabase.from("opportunities").select("*, profiles!inner!opportunities_org_id_fkey(id,name)").eq("id", id).single();
  if (!opp) return apiError("NOT_FOUND", "Opportunity not found", 404);
  const o = opp as { disciplines?: string[]; location?: string | null };
  const { data: me } = await supabase.from("profiles").select("disciplines,location_country").eq("id", profileId ?? "").maybeSingle();
  const { data: goals } = await supabase.from("career_goals").select("goal_type").eq("profile_id", profileId ?? "").eq("is_primary", true).limit(1);
  const artist = {
    disciplines: (me as { disciplines?: string[] } | null)?.disciplines ?? [],
    location_country: (me as { location_country?: string | null } | null)?.location_country ?? null,
    goal: (goals as { goal_type: string }[] | null)?.[0]?.goal_type.replaceAll("_", " ") ?? null
  };
  const { data: tracking } = await supabase
    .from("opportunity_tracking")
    .select("status")
    .eq("artist_id", profileId ?? "")
    .eq("opportunity_id", id)
    .maybeSingle();
  return Response.json({
    opportunity: opp,
    matchReasons: matchReasons(o, artist),
    trackingStatus: (tracking as { status: string } | null)?.status ?? null
  });
}
