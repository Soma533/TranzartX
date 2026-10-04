import { requireUser } from "@/services/auth-guard";
import { apiError } from "@/lib/logger";

export async function GET() {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  if (!profileId) return Response.json({ tracking: [] });
  const { data, error } = await supabase.from("opportunity_tracking").select("*, opportunities(*)").eq("artist_id", profileId);
  if (error) return apiError("DB", error.message, 500);
  return Response.json({ tracking: data });
}
