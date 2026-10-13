import type { SupabaseClient } from "@supabase/supabase-js";

export interface TodayData {
  goal: { title: string } | null;
  nextStep: string;
  opportunities: { id: string; title: string; location: string | null; deadline: string | null }[];
  people: { id: string; name: string; role: string }[];
  activity: { profileViews: number };
  commerce: { inquiries: number };
}

const EMPTY: TodayData = {
  goal: null,
  nextStep: "Complete your artist statement",
  opportunities: [],
  people: [],
  activity: { profileViews: 0 },
  commerce: { inquiries: 0 }
};

/**
 * Aggregated Today feed — PRD §10.
 * Shared by the /api/today route and the dashboard page so the page never has
 * to fetch its own public URL (which silently returned nothing when
 * NEXT_PUBLIC_APP_URL was unset).
 */
export async function buildToday(supabase: SupabaseClient, profileId: string | null): Promise<TodayData> {
  if (!profileId) return EMPTY;
  try {
    const [{ data: profile }, { data: goals }, { data: allOpps }, { data: people }] = await Promise.all([
      supabase.from("profiles").select("disciplines,location_country,avatar_url").eq("id", profileId).maybeSingle(),
      supabase.from("career_goals").select("goal_type").eq("profile_id", profileId).limit(1),
      supabase.from("opportunities").select("id,title,location,deadline,disciplines").order("deadline").limit(20),
      supabase.from("profiles").select("id,name,role").neq("id", profileId).limit(4)
    ]);
    const p = profile as { disciplines?: string[]; location_country?: string | null } | null;
    const matched = ((allOpps as { id: string; title: string; location: string | null; deadline: string | null; disciplines?: string[] }[] | null) ?? [])
      .filter((o) => {
        const discHit = !o.disciplines?.length || o.disciplines.some((d) => p?.disciplines?.includes(d));
        const locHit = !o.location || !p?.location_country || o.location.includes(p.location_country);
        return discHit && locHit;
      })
      .slice(0, 3)
      .map(({ id, title, location, deadline }) => ({ id, title, location, deadline }));

    const [{ count: profileViews }, { count: inquiryCount }] = await Promise.all([
      supabase.from("analytics_events").select("id", { count: "exact", head: true }).eq("event", "profile_view").eq("target_id", profileId),
      supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("to_artist_id", profileId)
    ]);
    const { data: steps } = await supabase
      .from("roadmap_items").select("title,status").eq("status", "TODO").limit(1);

    const goal = (goals as { goal_type: string }[] | null)?.[0];
    return {
      goal: goal ? { title: goal.goal_type.replaceAll("_", " ") } : null,
      nextStep: (steps as { title: string }[] | null)?.[0]?.title ?? "Complete your artist statement",
      opportunities: matched,
      people: (people as TodayData["people"]) ?? [],
      activity: { profileViews: profileViews ?? 0 },
      commerce: { inquiries: inquiryCount ?? 0 }
    };
  } catch {
    return EMPTY;
  }
}