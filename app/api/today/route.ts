import { requireUser } from "@/services/auth-guard";
import { apiError } from "@/lib/logger";

/** Aggregated Today feed — PRD §10. Best-effort; never 500s the page. */
export async function GET() {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  try {
    const [{ data: profile }, { data: goals }, { data: allOpps }, { data: people }] = await Promise.all([
      supabase.from("profiles").select("disciplines,location_country").eq("id", profileId ?? "").maybeSingle(),
      supabase.from("career_goals").select("*").eq("profile_id", profileId ?? "").limit(5),
      supabase.from("opportunities").select("*").order("deadline").limit(20),
      supabase.from("profiles").select("id,name,role").neq("id", profileId ?? "").limit(4)
    ]);
    const p = profile as { disciplines?: string[]; location_country?: string | null } | null;
    const matched = ((allOpps as { disciplines?: string[]; location?: string | null }[] | null) ?? [])
      .filter((o) => {
        if (!p) return true;
        const discHit = !o.disciplines?.length || o.disciplines.some((d) => p.disciplines?.includes(d));
        const locHit = !o.location || !p.location_country || o.location.includes(p.location_country);
        return discHit && locHit;
      })
      .slice(0, 3);
    const [{ count: profileViews }, { count: inquiryCount }] = await Promise.all([
      supabase.from("analytics_events").select("id", { count: "exact", head: true }).eq("event", "profile_view").eq("target_id", profileId ?? ""),
      supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("to_artist_id", profileId ?? "")
    ]);
    const goal = (goals as { goal_type: string }[] | null)?.[0];
    const { data: steps } = await supabase
      .from("roadmap_items")
      .select("title,status")
      .eq("status", "TODO")
      .limit(1);
    const nextStep =
      (steps as { title: string }[] | null)?.[0]?.title ?? "Complete your artist statement";
    return Response.json({
      goal: goal ? { title: goal.goal_type.replaceAll("_", " ") } : null,
      nextStep,
      opportunities: matched,
      people: people ?? [],
      activity: { profileViews: profileViews ?? 0 },
      commerce: { inquiries: inquiryCount ?? 0 }
    });
  } catch (err) {
    return apiError("TODAY", err instanceof Error ? err.message : "failed", 500);
  }
}
