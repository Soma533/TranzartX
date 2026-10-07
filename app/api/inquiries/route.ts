import { z } from "zod";
import { requireUser } from "@/services/auth-guard";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { sendEmail, inquiryEmailHtml } from "@/lib/email";
import { sanitizeText } from "@/lib/sanitize";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { apiError } from "@/lib/logger";

const inquirySchema = z.object({ artwork_id: z.string().uuid(), message: z.string().min(1).max(2000) });

export async function GET() {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const { data, error } = await supabase.from("inquiries").select("*").or(`from_id.eq.${profileId},to_artist_id.eq.${profileId}`).order("created_at", { ascending: false }).limit(50);
  if (error) return apiError("DB", error.message, 500);
  return Response.json({ inquiries: data });
}

export async function POST(request: Request) {
  if (!rateLimit(rateLimitKey(request, "inquiry"), 20)) return apiError("RATE_LIMIT", "Slow down", 429);
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const parsed = inquirySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !profileId) return apiError("VALIDATION", "artwork_id + message required", 422);
  const clean = sanitizeText(parsed.data.message, 2000);
  if (!clean) return apiError("VALIDATION", "Empty message", 422);
  const { data: art } = await supabase.from("artworks").select("artist_id,title").eq("id", parsed.data.artwork_id).single();
  if (!art) return apiError("NOT_FOUND", "Artwork not found", 404);
  const { data, error } = await supabase.from("inquiries").insert({
    artwork_id: parsed.data.artwork_id, from_id: profileId,
    to_artist_id: (art as { artist_id: string }).artist_id, message: clean
  }).select().single();
  if (error) return apiError("DB", error.message, 500);
  await supabase.from("analytics_events").insert({ actor_id: profileId, event: "inquiry", target_id: parsed.data.artwork_id });
  // Notify the artist in-app (respects notify prefs via saves-style default-on).
  const artistId = (art as { artist_id: string }).artist_id;
  const { data: artistProfile } = await supabase.from("profiles").select("user_id,name").eq("id", artistId).maybeSingle();
  const owner = artistProfile as { user_id: string; name: string } | null;
  if (owner) {
    const adminNotify = createAdminSupabase();
    await adminNotify.from("notifications").insert({
      user_id: owner.user_id,
      type: "inquiry",
      title: "New purchase inquiry",
      body: "A collector asked about one of your artworks.",
      link: "/inquiries"
    });
    // Best-effort email — never fails the request.
    try {
      const admin = createAdminSupabase();
      const { data: au } = await admin.auth.admin.getUserById(owner.user_id);
      const email = au?.user?.email ?? null;
      const artwork = art as { title: string };
      if (email) await sendEmail(email, `New inquiry: ${artwork.title}`, inquiryEmailHtml(owner.name, artwork.title, clean));
    } catch { /* email optional */ }
  }
  return Response.json({ inquiry: data }, { status: 201 });
}
