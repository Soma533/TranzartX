import { requireUser } from "@/services/auth-guard";
import { apiError } from "@/lib/logger";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase } = guard;
  const [{ data: profile }, { data: artworks }, { data: goals }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase.from("artworks").select("*").eq("artist_id", id).order("created_at", { ascending: false }).limit(24),
    supabase.from("career_goals").select("*").eq("profile_id", id).limit(5)
  ]);
  if (!profile) return apiError("NOT_FOUND", "Profile not found", 404);
  await supabase.from("analytics_events").insert({ event: "profile_view", target_id: id });
  return Response.json({ profile, artworks: artworks ?? [], goals: goals ?? [] });
}
