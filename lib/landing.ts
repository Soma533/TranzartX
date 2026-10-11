import { createClient } from "@/lib/supabase/client";

/**
 * Where a signed-in user should land.
 * A brand-new account has only the auto-created profile (completeness 20,
 * untouched), so it goes straight to profile setup — PRD §7 progressive profile.
 */
export function landingFor(completeness: number | null | undefined): string {
  return (completeness ?? 0) <= 20 ? "/onboarding" : "/today";
}

/** Resolves the post-login destination from the signed-in user's profile. */
export async function landingForCurrentUser(): Promise<string> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return "/login";
    const { data } = await supabase.from("profiles").select("profile_completeness").eq("user_id", session.user.id).maybeSingle();
    return landingFor((data as { profile_completeness: number } | null)?.profile_completeness);
  } catch {
    return "/today";
  }
}