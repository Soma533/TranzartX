import { createClient } from "@/lib/supabase/client";

export interface LandingProfile {
  onboarding_completed_at?: string | null;
  profile_completeness?: number | null;
}

/**
 * Where a signed-in user should land.
 * An explicit completion flag is authoritative. The completeness score is only
 * a fallback for accounts created before 0019, so a member who saved just
 * their name is never asked to onboard again.
 */
export function landingFor(profile: LandingProfile | null | undefined): string {
  if (!profile) return "/onboarding";
  if (profile.onboarding_completed_at) return "/today";
  const pct = profile.profile_completeness ?? 0;
  return pct <= 20 ? "/onboarding" : "/today";
}

/** Resolves the post-login destination from the signed-in user's profile. */
export async function landingForCurrentUser(): Promise<string> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return "/login";
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_completed_at,profile_completeness")
      .eq("user_id", session.user.id)
      .maybeSingle();
    return landingFor(data as LandingProfile | null);
  } catch {
    return "/today";
  }
}