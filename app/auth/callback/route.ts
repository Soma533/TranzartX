import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { landingFor } from "@/lib/landing";

/** OAuth callback — exchanges code for session, then routes by profile state. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requested = url.searchParams.get("next");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (toSet: { name: string; value: string; options?: Record<string, unknown> }[]) =>
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options as never))
        }
      }
    );
    await supabase.auth.exchangeCodeForSession(code);

    // New Google members still need profile setup before the dashboard.
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed_at,profile_completeness")
      .eq("user_id", user?.id ?? "")
      .maybeSingle();
    const target = requested ?? landingFor(profile);
    return NextResponse.redirect(new URL(target, url.origin));
  }
  return NextResponse.redirect(new URL(requested ?? "/login", url.origin));
}
