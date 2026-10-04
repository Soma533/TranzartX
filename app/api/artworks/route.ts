import { artworkSchema } from "@/schemas";
import { requireUser } from "@/services/auth-guard";
import { apiError } from "@/lib/logger";

export async function GET() {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  if (!profileId) return Response.json({ artworks: [] });
  const { data, error } = await supabase.from("artworks").select("*").eq("artist_id", profileId).order("created_at", { ascending: false });
  if (error) return apiError("DB", error.message, 500);
  return Response.json({ artworks: data });
}

export async function POST(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  if (!profileId) return apiError("NO_PROFILE", "Complete onboarding first", 400);
  const body = await request.json().catch(() => null);
  const parsed = artworkSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION", parsed.error.message, 422);
  const { data, error } = await supabase.from("artworks").insert({ artist_id: profileId, ...parsed.data }).select().single();
  if (error) return apiError("DB", error.message, 500);
  await supabase.from("analytics_events").insert({ actor_id: profileId, event: "artwork_upload", target_id: (data as { id: string }).id });
  return Response.json({ artwork: data }, { status: 201 });
}
