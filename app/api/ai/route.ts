import { aiProvider } from "@/lib/ai/provider";
import { requireUser } from "@/services/auth-guard";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";
import { apiError } from "@/lib/logger";

export async function POST(request: Request) {
  if (!rateLimit(rateLimitKey(request, "ai"), 20)) return apiError("RATE_LIMIT", "Slow down", 429);
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const body = (await request.json().catch(() => null)) as { kind?: string; rawText?: string; prompt?: string; context?: string } | null;
  const cleanPrompt = sanitizeText(body?.prompt ?? body?.rawText ?? "", 4000) ?? "";
  if (!cleanPrompt) return apiError("VALIDATION", "prompt or rawText required", 422);
  let context = sanitizeText(body?.context ?? "", 4000) ?? "";
  // Auto-build artist context when the client does not supply it (PRD §21).
  if (!context && profileId) {
    const [{ data: profile }, { data: goals }, { data: arts }] = await Promise.all([
      supabase.from("profiles").select("name,disciplines,mediums,location_country,career_stage,bio").eq("id", profileId).maybeSingle(),
      supabase.from("career_goals").select("goal_type,is_primary").eq("profile_id", profileId).limit(3),
      supabase.from("artworks").select("title,medium").eq("artist_id", profileId).limit(5)
    ]);
    const p = profile as { name?: string; disciplines?: string[]; mediums?: string[]; location_country?: string | null; career_stage?: string | null } | null;
    const g = (goals as { goal_type: string; is_primary: boolean }[] | null) ?? [];
    const a = (arts as { title: string; medium: string | null }[] | null) ?? [];
    context = [
      p?.name ? `Artist: ${p.name}` : null,
      p?.disciplines?.length ? `Disciplines: ${p.disciplines.join(", ")}` : null,
      p?.mediums?.length ? `Mediums: ${p.mediums.join(", ")}` : null,
      p?.location_country ? `Country: ${p.location_country}` : null,
      g.length ? `Goals: ${g.map((x) => x.goal_type.replaceAll("_", " ")).join("; ")}` : null,
      a.length ? `Works: ${a.map((x) => x.title).join("; ")}` : null
    ].filter(Boolean).join("\n").slice(0, 2000);
  }
  try {
    if (body?.kind) {
      const draft = await aiProvider.generate(body.kind as never, cleanPrompt);
      return Response.json({ draft });
    }
    const answer = await aiProvider.assist(cleanPrompt, context);
    return Response.json({ answer });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI failed";
    const status = message.startsWith("AI_DISABLED") ? 503 : 500;
    return apiError("AI_DISABLED", `${message} — you can still edit manually.`, status);
  }
}
