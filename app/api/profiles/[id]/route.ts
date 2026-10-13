import { requireUser } from "@/services/auth-guard";
import { apiError } from "@/lib/logger";
import { z } from "zod";

const paramsSchema = z.object({ id: z.string().uuid() });

/**
 * Public profile header data for any member — used by the Instagram-style
 * profile header. Profiles are publicly readable, so this also works signed out.
 */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const parsed = paramsSchema.safeParse(await ctx.params);
  if (!parsed.success) return apiError("VALIDATION", "Invalid profile id", 422);

  const guard = await requireUser();
  const supabase = "error" in guard ? (await serverClient()) : guard.supabase;
  if (!supabase) return apiError("NOT_CONFIGURED", "Supabase env vars missing", 503);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,name,short_desc,bio,location_city,location_country,career_stage,avatar_url,is_verified")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!profile) return apiError("NOT_FOUND", "Profile not found", 404);

  const { data: artworks } = await supabase
    .from("artworks")
    .select("id,title,image_url")
    .eq("artist_id", parsed.data.id)
    .order("created_at", { ascending: false })
    .limit(24);

  return Response.json({ profile, artworks: artworks ?? [] });
}

async function serverClient() {
  const { createServerSupabase } = await import("@/lib/supabase/server");
  return createServerSupabase();
}