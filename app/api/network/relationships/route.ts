import { z } from "zod";
import { requireUser } from "@/services/auth-guard";
import { apiError } from "@/lib/logger";

const querySchema = z.object({
  profileId: z.string().uuid(),
  relation: z.enum(["followers", "following"])
});

/** Instagram-style followers / following for any profile. */
export async function GET(request: Request) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries())
  );
  if (!parsed.success) return apiError("VALIDATION", "profileId required", 422);

  // Follows are public, so this works signed-out too; the guard is only here to
  // prefer the caller's own client so RLS applies correctly.
  const guard = await requireUser();
  const supabase = "error" in guard ? (await fallbackClient()) : guard.supabase;
  if (!supabase) return apiError("NOT_CONFIGURED", "Supabase env vars missing", 503);

  const { profileId, relation } = parsed.data;
  const column = relation === "followers" ? "following_id" : "follower_id";
  const { data: rows, error } = await supabase
    .from("follows")
    .select("profile_id")
    .eq(column, profileId);
  if (error) return apiError("DB", error.message, 500);

  const ids = ((rows as { profile_id: string }[] | null) ?? []).map((r) => r.profile_id);
  if (ids.length === 0) return Response.json({ people: [], count: 0 });

  const { data: people, error: pErr } = await supabase
    .from("profiles")
    .select("id,name,role,avatar_url,short_desc")
    .in("id", ids)
    .limit(200);
  if (pErr) return apiError("DB", pErr.message, 500);
  return Response.json({ people: people ?? [], count: ids.length });
}

/** Public (anonymous-safe) client for signed-out profile visitors. */
async function fallbackClient() {
  const { createServerSupabase } = await import("@/lib/supabase/server");
  const s = await createServerSupabase();
  return s;
}