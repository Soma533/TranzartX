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
  let completeness: number | null = null;
  try {
    const { supabase, user } = await getSessionUser();
    userId = user?.id ?? null;
    if (userId) {
      const { data } = await supabase
        .from("profiles")
        .select("profile_completeness")
        .eq("user_id", userId)
        .maybeSingle();
      completeness = (data as { profile_completeness: number } | null)?.profile_completeness ?? null;
    }
  } catch {
    userId = null;
  }

  if (!userId) redirect("/signup");
  redirect(landingFor(completeness));
}