import { opportunitySchema, trackingSchema } from "@/schemas";
import { requireUser } from "@/services/auth-guard";
import { matchReasons } from "@/services/domain.service";
import { apiError } from "@/lib/logger";

export async function GET(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const params = new URL(request.url).searchParams;
  const q = params.get("q") ?? "";
  const discipline = params.get("discipline") ?? "";
  // Load artist context once for personalized matching (PRD §16).
  const { data: me } = await supabase.from("profiles").select("disciplines,location_country").eq("id", profileId ?? "").maybeSingle();
  const { data: goals } = await supabase.from("career_goals").select("goal_type").eq("profile_id", profileId ?? "").eq("is_primary", true).limit(1);
  const artist = {
    disciplines: (me as { disciplines?: string[] } | null)?.disciplines ?? [],
    location_country: (me as { location_country?: string | null } | null)?.location_country ?? null,
    goal: (goals as { goal_type: string }[] | null)?.[0]?.goal_type.replaceAll("_", " ") ?? null
  };
  let query = supabase.from("opportunities").select("*").order("deadline", { ascending: true }).limit(50);
  if (q) query = query.ilike("title", `%${q}%`);
  if (discipline) query = query.overlaps("disciplines", [discipline]);
  const { data, error } = await query;
  if (error) return apiError("DB", error.message, 500);
  const enriched = ((data as { disciplines?: string[]; location?: string | null }[] | null) ?? []).map((o) => ({
    ...o,
    matchReasons: matchReasons(o, artist)
  }));
  return Response.json({ opportunities: enriched });
}

export async function POST(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  if (!profileId) return apiError("NO_PROFILE", "Complete onboarding first", 400);
  const parsed = opportunitySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION", parsed.error.message, 422);
  const { data, error } = await supabase.from("opportunities").insert({ org_id: profileId, ...parsed.data }).select().single();
  if (error) return apiError("DB", error.message, 500);
  return Response.json({ opportunity: data }, { status: 201 });
}

export async function PUT(request: Request) {
  // Save / track an opportunity: { opportunity_id, status }
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  if (!profileId) return apiError("NO_PROFILE", "Complete onboarding first", 400);
  const parsed = trackingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION", parsed.error.message, 422);
  const { error } = await supabase.from("opportunity_tracking").upsert({
    artist_id: profileId,
    opportunity_id: parsed.data.opportunity_id,
    status: parsed.data.status
  });
  if (error) return apiError("DB", error.message, 500);
  return Response.json({ ok: true });
}
