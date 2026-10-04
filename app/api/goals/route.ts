import { goalSchema } from "@/schemas";
import { requireUser } from "@/services/auth-guard";
import { defaultRoadmapForGoal } from "@/lib/ai/provider";
import { apiError } from "@/lib/logger";

export async function GET() {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  if (!profileId) return Response.json({ goals: [] });
  const { data, error } = await supabase.from("career_goals").select("*").eq("profile_id", profileId);
  if (error) return apiError("DB", error.message, 500);
  return Response.json({ goals: data });
}

export async function POST(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  if (!profileId) return apiError("NO_PROFILE", "Complete onboarding first", 400);
  const parsed = goalSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION", parsed.error.message, 422);
  const { data: goal, error } = await supabase.from("career_goals").insert({ profile_id: profileId, ...parsed.data }).select().single();
  if (error || !goal) return apiError("DB", error?.message ?? "insert failed", 500);
  const steps = defaultRoadmapForGoal(parsed.data.goal_type).map((title, i) => ({
    goal_id: (goal as { id: string }).id, title, sort_order: i
  }));
  await supabase.from("roadmap_items").insert(steps);
  return Response.json({ goal }, { status: 201 });
}
