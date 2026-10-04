import { requireUser } from "@/services/auth-guard";
import { apiError } from "@/lib/logger";

export async function GET() {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, user } = guard;
  const { data, error } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30);
  if (error) return apiError("DB", error.message, 500);
  return Response.json({ notifications: data });
}

export async function POST(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, user, profileId } = guard;
  const body = (await request.json().catch(() => null)) as {
    event?: string; target_id?: string; title?: string; body?: string; link?: string;
  } | null;
  if (!body?.event) return apiError("VALIDATION", "event required", 422);
  await supabase.from("analytics_events").insert({ actor_id: profileId, event: body.event.slice(0, 60), target_id: body.target_id ?? null });
  // Actionable notifications (PRD §24): persist when a title is supplied.
  if (body.title) {
    const { error } = await supabase.from("notifications").insert({
      user_id: user.id,
      type: body.event.slice(0, 60),
      title: body.title.slice(0, 140),
      body: body.body?.slice(0, 500) ?? null,
      link: body.link?.slice(0, 300) ?? null
    });
    if (error) return apiError("DB", error.message, 500);
  }
  return Response.json({ ok: true });
}
