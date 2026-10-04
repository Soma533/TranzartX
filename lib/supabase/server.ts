import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabase() {
  const cookieStore = await cookies();
  // Placeholder fallback lets pages/APIs respond (401/empty) before .env is configured.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (
        toSet: { name: string; value: string; options?: Record<string, unknown> }[]
      ) => {
        toSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options as never)
        );
      }
    }
  });
}

export async function getSessionUser() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}
