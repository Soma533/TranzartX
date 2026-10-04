import { requireUser } from "@/services/auth-guard";
import { apiError } from "@/lib/logger";

/** Single collection with its artworks. Ownership enforced. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const { data: col } = await supabase.from("collections").select("*").eq("id", id).single();
  const c = col as { id: string; artist_id: string } | null;
  if (!c) return apiError("NOT_FOUND", "Collection not found", 404);
  if (c.artist_id !== profileId) return apiError("FORBIDDEN", "Not your collection", 403);
  const { data: arts } = await supabase.from("artworks").select("id,title,image_url,price_cents,currency").eq("collection_id", id).order("created_at", { ascending: false });
  return Response.json({ collection: col, artworks: arts ?? [] });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const { data: col } = await supabase.from("collections").select("artist_id").eq("id", id).single();
  if (!col || (col as { artist_id: string }).artist_id !== profileId)
    return apiError("FORBIDDEN", "Not your collection", 403);
  // Unassign artworks first so nothing is orphaned behind a deleted collection.
  await supabase.from("artworks").update({ collection_id: null }).eq("collection_id", id);
  const { error } = await supabase.from("collections").delete().eq("id", id);
  if (error) return apiError("DB", error.message, 500);
  return Response.json({ ok: true });
}
