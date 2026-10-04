import { requireUser } from "@/services/auth-guard";
import { apiError } from "@/lib/logger";

export async function GET(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const goalId = new URL(request.url).searchParams.get("goalId");
  if (!profileId) return Response.json({ items: [] });
  let query = supabase.from("roadmap_items").select("*, career_goals!inner(profile_id)").order("sort_order");
  const { data, error } = await query;
  if (error) return apiError("DB", error.message, 500);
  const items = ((data ?? []) as { goal_id: string; career_goals: { profile_id: string } }[])
    .filter((r) => r.career_goals.profile_id === profileId && (!goalId || r.goal_id === goalId));
  return Response.json({ items });
}

export async function PATCH(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase } = guard;
  const body = (await request.json().catch(() => null)) as { id?: string; status?: string } | null;
  if (!body?.id || !body?.status) return apiError("VALIDATION", "id + status required", 422);
  const { error } = await supabase.from("roadmap_items").update({ status: body.status }).eq("id", body.id);
  if (error) return apiError("DB", error.message, 500);
  return Response.json({ ok: true });
}
