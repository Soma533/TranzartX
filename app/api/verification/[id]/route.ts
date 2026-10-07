import { z } from "zod";
import { requireUser } from "@/services/auth-guard";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { apiError } from "@/lib/logger";

const reviewSchema = z.object({ status: z.enum(["APPROVED", "REJECTED"]) });

/** Admin review of verification requests. Requires profiles.role = ADMIN. */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const { data: me } = await supabase.from("profiles").select("role").eq("id", profileId ?? "").maybeSingle();
  if ((me as { role: string } | null)?.role !== "ADMIN") return apiError("FORBIDDEN", "Admin only", 403);
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION", "status required", 422);

  // Admin writes touch other users' rows — service role bypasses owner-only RLS.
  const admin = createAdminSupabase();
  const { data: req } = await admin.from("verification_requests").select("profile_id").eq("id", id).maybeSingle();
  if (!req) return apiError("NOT_FOUND", "Request not found", 404);
  const target = req as { profile_id: string };
  const { error } = await admin
    .from("verification_requests")
    .update({ status: parsed.data.status, reviewed_by: profileId })
    .eq("id", id);
  if (error) return apiError("DB", error.message, 500);
  if (parsed.data.status === "APPROVED") {
    await admin.from("profiles").update({ is_verified: true }).eq("id", target.profile_id);
  }
  return Response.json({ ok: true });
}
