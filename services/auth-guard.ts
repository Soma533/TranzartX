import { getSessionUser } from "@/lib/supabase/server";
import { apiError } from "@/lib/logger";

/** Require auth; returns {supabase,user,profileId?}. Profile lookup is best-effort. */
export async function requireUser() {
  let session;
  try {
    session = await getSessionUser();
  } catch {
    return { error: apiError("NOT_CONFIGURED", "Supabase env vars missing — add .env credentials", 503) as Response };
  }
  const { supabase, user } = session;
  if (!user) return { error: apiError("UNAUTHORIZED", "Sign in required", 401) as Response };
  let profileId: string | null = null;
  try {
    const { data } = await supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle();
    profileId = (data as { id: string } | null)?.id ?? null;
  } catch {
    profileId = null;
  }
  return { supabase, user, profileId };
}
