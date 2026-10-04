import { artworkSchema } from "@/schemas";
import { requireUser } from "@/services/auth-guard";
import { createServerSupabase } from "@/lib/supabase/server";
import { apiError } from "@/lib/logger";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  // Public marketplace page — no login required (public RLS read).
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("artworks").select("*, profiles!inner(id,name,avatar_url)").eq("id", id).single();
  if (error || !data) return apiError("NOT_FOUND", "Artwork not found", 404);
  await supabase.from("analytics_events").insert({ event: "artwork_view", target_id: id }).then(() => null, () => null);
  return Response.json({ artwork: data });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const parsed = artworkSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION", parsed.error.message, 422);
  const { data: existing } = await supabase.from("artworks").select("artist_id").eq("id", id).single();
  if (!existing || (existing as { artist_id: string }).artist_id !== profileId)
    return apiError("FORBIDDEN", "Not your artwork", 403);
  const { data, error } = await supabase.from("artworks").update(parsed.data).eq("id", id).select().single();
  if (error) return apiError("DB", error.message, 500);
  return Response.json({ artwork: data });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const { data: existing } = await supabase.from("artworks").select("artist_id").eq("id", id).single();
  if (!existing || (existing as { artist_id: string }).artist_id !== profileId)
    return apiError("FORBIDDEN", "Not your artwork", 403);
  const { error } = await supabase.from("artworks").delete().eq("id", id);
  if (error) return apiError("DB", error.message, 500);
  return Response.json({ ok: true });
}
