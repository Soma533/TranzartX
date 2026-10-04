import { z } from "zod";
import { requireUser } from "@/services/auth-guard";
import { sanitizeText } from "@/lib/sanitize";
import { apiError } from "@/lib/logger";

const requestSchema = z.object({
  kind: z.enum(["IDENTITY", "GALLERY", "EXHIBITION", "ORGANIZATION"]).default("IDENTITY"),
  evidence: z.string().max(2000).optional().nullable()
});

/** Verification requests (PRD §27). Artists request; ADMINs review. */
export async function GET() {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const { data, error } = await supabase
    .from("verification_requests")
    .select("*")
    .eq("profile_id", profileId ?? "")
    .order("created_at", { ascending: false });
  if (error) return apiError("DB", error.message, 500);
  return Response.json({ requests: data });
}

export async function POST(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  if (!profileId) return apiError("NO_PROFILE", "Complete onboarding first", 400);
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION", "Invalid request", 422);
  const { data: pending } = await supabase
    .from("verification_requests")
    .select("id")
    .eq("profile_id", profileId)
    .eq("status", "PENDING")
    .limit(1);
  if ((pending as { id: string }[] | null)?.length) return apiError("PENDING", "A request is already under review", 409);
  const evidence = sanitizeText(parsed.data.evidence ?? "", 2000);
  const { data, error } = await supabase
    .from("verification_requests")
    .insert({ profile_id: profileId, kind: parsed.data.kind, evidence })
    .select()
    .single();
  if (error) return apiError("DB", error.message, 500);
  return Response.json({ request: data }, { status: 201 });
}
