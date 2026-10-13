import { requireUser } from "@/services/auth-guard";
import { buildToday } from "@/services/today.service";

/** Today feed — PRD §10. Never 500s; the page renders with placeholders. */
export async function GET() {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  return Response.json(await buildToday(supabase, profileId));
}