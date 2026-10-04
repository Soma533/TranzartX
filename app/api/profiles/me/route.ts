import { profileSchema } from "@/schemas";
import { requireUser } from "@/services/auth-guard";
import { scoreCompleteness } from "@/services/domain.service";
import { stripEmptyStrings } from "@/lib/sanitize";
import { apiError } from "@/lib/logger";

export async function GET() {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, user } = guard;
  const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  return Response.json({ profile: data ?? null });
}

export async function PATCH(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, user } = guard;
  const body = await request.json().catch(() => null);
  // Treat empty strings as absent so optional URL/text fields never trip validation.
  const cleaned = stripEmptyStrings((body ?? {}) as Record<string, unknown>);
  const parsed = profileSchema.partial().safeParse(cleaned);
  if (!parsed.success) return apiError("VALIDATION", parsed.error.message, 422);
  const { data: existing } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  const { pct } = scoreCompleteness({ ...(existing as Record<string, unknown>), ...parsed.data } as never);
  if (!existing) {
    const { data, error } = await supabase
      .from("profiles")
      .insert({ user_id: user.id, ...parsed.data, profile_completeness: pct })
      .select()
      .single();
    if (error) return apiError("DB", error.message, 500);
    return Response.json({ profile: data });
  }
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...parsed.data, profile_completeness: pct })
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) return apiError("DB", error.message, 500);
  return Response.json({ profile: data });
}
