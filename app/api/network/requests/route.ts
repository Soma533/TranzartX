import { z } from "zod";
import { requireUser } from "@/services/auth-guard";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { apiError } from "@/lib/logger";

const reviewSchema = z.object({ connection_id: z.string().uuid(), action: z.enum(["accept", "decline"]) });

/** Incoming pending connection requests with requester profiles (PRD §18). */
export async function GET() {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const { data, error } = await supabase
    .from("connections")
    .select("id,created_at,requester_id,profiles!connections_requester_id_fkey(id,name,role)")
    .eq("receiver_id", profileId ?? "")
    .eq("status", "PENDING")
    .order("created_at", { ascending: false });
  if (error) return apiError("DB", error.message, 500);
  return Response.json({ requests: data ?? [] });
}

/** Accept or decline a request. Only the receiver may review. */
export async function PATCH(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION", "connection_id + action required", 422);
  const { data: conn } = await supabase.from("connections").select("requester_id,receiver_id").eq("id", parsed.data.connection_id).maybeSingle();
  const c = conn as { requester_id: string; receiver_id: string } | null;
  if (!c || c.receiver_id !== profileId) return apiError("FORBIDDEN", "Not your request to review", 403);
  const next = parsed.data.action === "accept" ? "ACCEPTED" : "REJECTED";
  const { error } = await supabase.from("connections").update({ status: next }).eq("id", parsed.data.connection_id);
  if (error) return apiError("DB", error.message, 500);
  if (next === "ACCEPTED") {
    // Notify the requester their invitation landed.
    const [{ data: me }, { data: them }] = await Promise.all([
      supabase.from("profiles").select("user_id,name").eq("id", profileId ?? "").maybeSingle(),
      supabase.from("profiles").select("user_id").eq("id", c.requester_id).maybeSingle()
    ]);
    const owner = them as { user_id: string } | null;
    const self = me as { name: string } | null;
    if (owner) {
      const admin = createAdminSupabase();
      await admin.from("notifications").insert({
        user_id: owner.user_id, type: "connection",
        title: "Connection accepted",
        body: `${self?.name ?? "Someone"} accepted your connection request.`,
        link: "/network"
      });
    }
    void me;
  }
  return Response.json({ ok: true, status: next });
}
