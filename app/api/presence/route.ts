import { requireUser } from "@/services/auth-guard";
import { createAdminSupabase } from "@/lib/supabase/admin";

/**
 * Presence heartbeat. Called on chat load and periodically so contacts can show
 * "last seen". Online/away itself is realtime (Supabase presence), not stored.
 */
export async function POST() {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, user, profileId } = guard;
  void user;
  if (!profileId) return Response.json({ ok: false }, { status: 202 });
  const now = new Date().toISOString();
  const { error } = await supabase.from("profiles").update({ last_seen_at: now }).eq("id", profileId);
  if (error) {
    // Column may not exist yet — presence is non-critical, so never hard-fail.
    return Response.json({ ok: false }, { status: 202 });
  }
  void createAdminSupabase;
  return Response.json({ ok: true, last_seen_at: now });
}