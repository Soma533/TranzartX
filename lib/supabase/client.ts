import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Placeholder fallback lets the UI boot without .env; requests fail gracefully until configured.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
  return createBrowserClient(url, key);
}
