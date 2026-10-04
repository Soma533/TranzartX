import { z } from "zod";
import { requireUser } from "@/services/auth-guard";
import { sanitizeText } from "@/lib/sanitize";
import { apiError } from "@/lib/logger";

const startSchema = z.object({
  targetId: z.string().uuid(),
  artwork_id: z.string().uuid().optional().nullable(),
  body: z.string().min(1).max(4000).optional().nullable()
});

/**
 * Start (or reuse) a 1:1 conversation — PRD §18 messaging.
 * Finds an existing shared conversation, else creates conversation + participants,
 * optionally with a first message. Never allows self-chat.
 */
export async function POST(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const parsed = startSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !profileId) return apiError("VALIDATION", "targetId required", 422);
  if (parsed.data.targetId === profileId) return apiError("VALIDATION", "Cannot message yourself", 422);

  const { data: mine } = await supabase.from("conversation_participants").select("conversation_id").eq("profile_id", profileId);
  const myConvs = ((mine as { conversation_id: string }[] | null) ?? []).map((r) => r.conversation_id);
  if (myConvs.length > 0) {
    const { data: shared } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("profile_id", parsed.data.targetId)
      .in("conversation_id", myConvs)
      .limit(1);
    const hit = (shared as { conversation_id: string }[] | null)?.[0];
    if (hit) return Response.json({ conversation_id: hit.conversation_id, reused: true });
  }

  const { data: conv, error: convErr } = await supabase.from("conversations").insert({}).select().single();
  if (convErr || !conv) return apiError("DB", convErr?.message ?? "create failed", 500);
  const cid = (conv as { id: string }).id;
  const { error: partErr } = await supabase.from("conversation_participants").insert([
    { conversation_id: cid, profile_id: profileId },
    { conversation_id: cid, profile_id: parsed.data.targetId }
  ]);
  if (partErr) return apiError("DB", partErr.message, 500);

  const first = sanitizeText(parsed.data.body ?? "", 4000);
  if (first) {
    await supabase.from("messages").insert({
      conversation_id: cid, sender_id: profileId, body: first, artwork_id: parsed.data.artwork_id ?? null
    });
  }
  return Response.json({ conversation_id: cid, reused: false }, { status: 201 });
}
