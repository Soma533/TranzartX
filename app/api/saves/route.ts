import { z } from "zod";
import { requireUser } from "@/services/auth-guard";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { apiError } from "@/lib/logger";

const saveSchema = z.object({ artwork_id: z.string().uuid() });

/** Collector saves — PRD §25. Saves notify the artist when preferences allow. */
export async function POST(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, user, profileId } = guard;
  const parsed = saveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !profileId) return apiError("VALIDATION", "artwork_id required", 422);
  const { data: art } = await supabase.from("artworks").select("artist_id,title").eq("id", parsed.data.artwork_id).single();
  if (!art) return apiError("NOT_FOUND", "Artwork not found", 404);
  const { error } = await supabase.from("saved_artworks").upsert({ collector_id: profileId, artwork_id: parsed.data.artwork_id });
  if (error) return apiError("DB", error.message, 500);
  await supabase.from("analytics_events").insert({ actor_id: profileId, event: "artwork_save", target_id: parsed.data.artwork_id });
  const artist = art as { artist_id: string; title: string };
  const { data: artistProfile } = await supabase.from("profiles").select("user_id,notify_saves").eq("id", artist.artist_id).maybeSingle();
  const prefs = artistProfile as { user_id: string; notify_saves: boolean } | null;
  if (prefs?.notify_saves !== false && prefs) {
    const admin = createAdminSupabase();
    await admin.from("notifications").insert({
      user_id: prefs.user_id,
      type: "artwork_save",
      title: "Someone saved your artwork",
      body: `${artist.title} was saved by a collector.`,
      link: `/artworks/${parsed.data.artwork_id}`
    });
  }
  void user;
  return Response.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const id = new URL(request.url).searchParams.get("artwork_id");
  if (!id) return apiError("VALIDATION", "artwork_id required", 422);
  const { error } = await supabase.from("saved_artworks").delete().eq("collector_id", profileId ?? "").eq("artwork_id", id);
  if (error) return apiError("DB", error.message, 500);
  return Response.json({ ok: true });
}
