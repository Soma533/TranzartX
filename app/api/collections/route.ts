import { requireUser } from "@/services/auth-guard";
import { apiError } from "@/lib/logger";

export async function GET() {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  if (!profileId) return Response.json({ collections: [] });
  const { data, error } = await supabase.from("collections").select("*").eq("artist_id", profileId);
  if (error) return apiError("DB", error.message, 500);
  return Response.json({ collections: data });
}

export async function POST(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  if (!profileId) return apiError("NO_PROFILE", "Complete onboarding first", 400);
  const body = (await request.json().catch(() => null)) as { title?: string; description?: string } | null;
  if (!body?.title) return apiError("VALIDATION", "title required", 422);
  const { data, error } = await supabase.from("collections").insert({ artist_id: profileId, title: body.title.slice(0, 120), description: body.description?.slice(0, 2000) ?? null }).select().single();
  if (error) return apiError("DB", error.message, 500);
  return Response.json({ collection: data }, { status: 201 });
}
