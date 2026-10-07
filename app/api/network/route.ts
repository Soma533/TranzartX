import { requireUser } from "@/services/auth-guard";
import { createAdminSupabase } from "@/lib/supabase/admin";
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
  const { supabase, user, profileId } = guard;
  const body = (await request.json().catch(() => null)) as { action?: string; targetId?: string } | null;
  if (!body?.action || !body?.targetId || !profileId) return apiError("VALIDATION", "action + targetId required", 422);
  if (body.targetId === profileId) return apiError("VALIDATION", "Cannot target yourself", 422);
  const { data: me } = await supabase.from("profiles").select("name").eq("id", profileId).maybeSingle();
  const myName = (me as { name: string } | null)?.name ?? "Someone";
  const { data: target } = await supabase.from("profiles").select("user_id,name").eq("id", body.targetId).maybeSingle();
  const targetUser = target as { user_id: string; name: string } | null;
  void user;
  if (body.action === "follow") {
    const { error } = await supabase.from("follows").upsert({ follower_id: profileId, following_id: body.targetId });
    if (error) return apiError("DB", error.message, 500);
    if (targetUser) {
      // Cross-user write — service role bypasses owner-only notification RLS.
      const admin = createAdminSupabase();
      await admin.from("notifications").insert({
        user_id: targetUser.user_id, type: "follow",
        title: "New follower",
        body: `${myName} started following you.`,
        link: "/network"
      });
    }
    return Response.json({ ok: true, following: true });
  }
  if (body.action === "connect") {
    // No duplicate or reverse-pending requests.
    const { data: existing } = await supabase.from("connections").select("id,status").or(
      `and(requester_id.eq.${profileId},receiver_id.eq.${body.targetId}),and(requester_id.eq.${body.targetId},receiver_id.eq.${profileId})`
    ).limit(1);
    if ((existing as { id: string }[] | null)?.length) return apiError("EXISTS", "Already requested or connected", 409);
    const { error } = await supabase.from("connections").insert({ requester_id: profileId, receiver_id: body.targetId });
    if (error) return apiError("DB", error.message, 500);
    if (targetUser) {
      const admin = createAdminSupabase();
      await admin.from("notifications").insert({
        user_id: targetUser.user_id, type: "connection",
        title: "New connection request",
        body: `${myName} wants to connect professionally.`,
        link: "/network"
      });
    }
    return Response.json({ ok: true, requested: true });
  }
  if (body.action === "unfollow") {
    const { error } = await supabase.from("follows").delete().eq("follower_id", profileId).eq("following_id", body.targetId);
    if (error) return apiError("DB", error.message, 500);
    return Response.json({ ok: true, following: false });
  }
  return apiError("VALIDATION", "unknown action", 422);
}
