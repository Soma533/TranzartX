import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { landingFor } from "@/lib/landing";

/**
 * The site root is the entry door: signed-out visitors land on sign-up,
 * new members are pushed straight into profile setup, returning members go to
 * their dashboard. Marketing content lives at /welcome.
 */
export default async function Home() {
  let userId: string | null = null;
  let profile: { onboarding_completed_at?: string | null; profile_completeness?: number | null } | null = null;
  try {
    const { supabase, user } = await getSessionUser();
    userId = user?.id ?? null;
    if (userId) {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed_at,profile_completeness")
        .eq("user_id", userId)
        .maybeSingle();
      profile = data ?? null;
    }
  } catch {
    userId = null;
  }

  if (!userId) redirect("/signup");
  redirect(landingFor(profile));
}