/** Env readiness probe — booleans only, never secret values. Rejects placeholders. */
function looksReal(v: string | undefined, minLen: number): boolean {
  if (!v || v.length < minLen) return false;
  return !/xxx|xyzcompany|\.\.\.|your-|changeme|placeholder/i.test(v);
}

export async function GET() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const ai = (process.env.AI_PROVIDER ?? "NONE").toUpperCase();
  const warnings: string[] = [];
  let host: string | null = null;
  let restReachable: boolean | null = null;
  let keyRejected = false;
  try {
    const parsed = new URL(url);
    host = parsed.hostname;
    if (!/^[a-z0-9-]+\.supabase\.co$/.test(host)) warnings.push(`Supabase URL host looks wrong: ${host}`);
    if (parsed.pathname && parsed.pathname !== "/") warnings.push("Supabase URL must end at .co with nothing after it (no /auth/v1, no trailing path)");
  } catch {
    warnings.push("NEXT_PUBLIC_SUPABASE_URL is not a valid URL (check for spaces or a missing https://)");
  }
  // Live check against a real table: proves URL + key + migrations in one shot.
  if (host && looksReal(anon, 40)) {
    try {
      const r = await fetch(`https://${host}/rest/v1/profiles?select=id&limit=1`, {
        headers: { apikey: anon, Authorization: `Bearer ${anon}` }
      });
      if (r.status === 200) {
        restReachable = true;
      } else if (r.status === 401) {
        keyRejected = true;
        warnings.push("Supabase reachable but the anon key was rejected — re-copy the anon public key");
      } else if (r.status === 404) {
        restReachable = false;
        warnings.push("profiles table missing — run supabase/setup.sql in the SQL Editor");
      } else {
        restReachable = false;
        warnings.push(`Supabase answered HTTP ${r.status} — check project status (paused?)`);
      }
    } catch {
      restReachable = false;
      warnings.push("Could not reach the Supabase project — check the URL and project status (paused?)");
    }
  }
  if (url.includes("xyzcompany")) warnings.push("NEXT_PUBLIC_SUPABASE_URL still has the example placeholder — paste your real Project URL");
  if (!looksReal(anon, 40)) warnings.push("NEXT_PUBLIC_SUPABASE_ANON_KEY looks missing or placeholder");
  if (!looksReal(process.env.SUPABASE_SERVICE_ROLE_KEY, 40)) warnings.push("SUPABASE_SERVICE_ROLE_KEY looks missing or placeholder");

  return Response.json({
    supabase: host !== null && /^[a-z0-9-]+\.supabase\.co$/.test(host) && looksReal(anon, 40) && restReachable === true && !keyRejected,
    host,
    restReachable,
    serviceRole: looksReal(process.env.SUPABASE_SERVICE_ROLE_KEY, 40),
    appUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    paystack: looksReal(process.env.PAYSTACK_SECRET_KEY, 12),
    resend: looksReal(process.env.RESEND_API_KEY, 8),
    warnings,
    aiProvider: ai,
    aiKeys: {
      openai: looksReal(process.env.OPENAI_API_KEY, 20),
      anthropic: looksReal(process.env.ANTHROPIC_API_KEY, 20)
    },
    aiReady:
      (ai === "OPENAI" && looksReal(process.env.OPENAI_API_KEY, 20)) ||
      (ai === "ANTHROPIC" && looksReal(process.env.ANTHROPIC_API_KEY, 20))
  });
}
