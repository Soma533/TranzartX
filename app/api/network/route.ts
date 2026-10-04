import { requireUser } from "@/services/auth-guard";
import { apiError } from "@/lib/logger";

export async function GET() {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  if (!profileId) return Response.json({ suggestions: [] });
  const { data, error } = await supabase.from("profiles").select("id,name,role,disciplines").neq("id", profileId).limit(8);
  if (error) return apiError("DB", error.message, 500);
  return Response.json({ suggestions: data });
}

export async function POST(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const body = (await request.json().catch(() => null)) as { action?: string; targetId?: string } | null;
  if (!body?.action || !body?.targetId || !profileId) return apiError("VALIDATION", "action + targetId required", 422);
  if (body.action === "follow") {
    const { error } = await supabase.from("follows").upsert({ follower_id: profileId, following_id: body.targetId });
    if (error) return apiError("DB", error.message, 500);
    return Response.json({ ok: true });
  }
  if (body.action === "connect") {
    const { error } = await supabase.from("connections").insert({ requester_id: profileId, receiver_id: body.targetId });
    if (error) return apiError("DB", error.message, 500);
    return Response.json({ ok: true });
  }
  return apiError("VALIDATION", "unknown action", 422);
}
