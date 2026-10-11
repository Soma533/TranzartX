import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { messageSchema } from "@/schemas";
import { requireUser } from "@/services/auth-guard";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { sanitizeText } from "@/lib/sanitize";
import { conversationList } from "@/app/api/messages/inbox";
import { apiError } from "@/lib/logger";

const editSchema = z.object({ id: z.string().uuid(), body: z.string().min(1).max(4000) });
const deleteSchema = z.object({ id: z.string().uuid() });
const forwardSchema = z.object({ id: z.string().uuid(), to: z.string().uuid() });

export async function GET(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const conv = new URL(request.url).searchParams.get("conversation");
  if (conv) {
    const { data, error } = await supabase.from("messages").select("*").eq("conversation_id", conv).order("created_at");
    if (error) return apiError("DB", error.message, 500);
    // Opening a conversation stamps delivery for everything in it and marks
    // others' messages read — this powers the ✓/✓✓/blue-✓✓ ticks.
    const now = new Date().toISOString();
    await supabase.from("messages").update({ delivered_at: now }).eq("conversation_id", conv).is("delivered_at", null);
    await supabase.from("messages").update({ read_at: now }).eq("conversation_id", conv).neq("sender_id", profileId ?? "").is("read_at", null);
    // Remember how far this participant has read, for the unread highlight.
    await supabase
      .from("conversation_participants")
      .update({ last_read_at: now })
      .eq("conversation_id", conv)
      .eq("profile_id", profileId ?? "");
    const { data: fresh } = await supabase.from("messages").select("*").eq("conversation_id", conv).order("created_at");
    return Response.json({ messages: fresh ?? data });
  }
  return conversationList(supabase, profileId ?? "");
}

export async function POST(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const raw = await request.json().catch(() => null);

  // Forward: copy a message into (or onto) a conversation with someone else.
  const fwd = forwardSchema.safeParse(raw);
  if (fwd.success) return forwardMessage(supabase, profileId ?? "", fwd.data);

  const parsed = messageSchema.safeParse(raw);
  if (!parsed.success) return apiError("VALIDATION", parsed.error.message, 422);
  if (!profileId) return apiError("VALIDATION", "Create your profile first", 422);
  const body = sanitizeText(parsed.data.body, 4000);
  if (!body) return apiError("VALIDATION", "Empty message", 422);
  const { data, error } = await supabase.from("messages").insert({ ...parsed.data, body, sender_id: profileId }).select().single();
  if (error) return apiError("DB", error.message, 500);
  // Bubble the conversation to the top of both inboxes.
  await supabase.from("conversations").update({ last_message_at: data.created_at }).eq("id", parsed.data.conversation_id);
  await notifyOthers(supabase, profileId, parsed.data.conversation_id);
  return Response.json({ message: data }, { status: 201 });
}

/** Edit own message — rewrites the body and stamps "edited". */
export async function PATCH(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const parsed = editSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION", "id and body required", 422);
  const body = sanitizeText(parsed.data.body, 4000);
  if (!body) return apiError("VALIDATION", "Empty message", 422);
  const { data, error } = await supabase
    .from("messages")
    .update({ body, edited_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("sender_id", profileId ?? "")
    .select()
    .maybeSingle();
  if (error) return apiError("DB", error.message, 500);
  if (!data) return apiError("FORBIDDEN", "You can only edit your own messages", 403);
  return Response.json({ message: data });
}

/** Soft-delete own message — the row stays so conversation history is coherent. */
export async function DELETE(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION", "id required", 422);
  const { data, error } = await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("sender_id", profileId ?? "")
    .select()
    .maybeSingle();
  if (error) return apiError("DB", error.message, 500);
  if (!data) return apiError("FORBIDDEN", "You can only delete your own messages", 403);
  return Response.json({ ok: true });
}

async function forwardMessage(
  supabase: SupabaseClient,
  profileId: string,
  input: { id: string; to: string }
) {
  if (input.to === profileId) return apiError("VALIDATION", "Cannot forward to yourself", 422);
  const { data: original } = await supabase.from("messages").select("*").eq("id", input.id).maybeSingle();
  if (!original) return apiError("NOT_FOUND", "Message not found", 404);
  if (original.deleted_at) return apiError("VALIDATION", "Deleted message cannot be forwarded", 422);

  // Find or create the 1:1 conversation with the recipient.
  const { data: mine } = await supabase.from("conversation_participants").select("conversation_id").eq("profile_id", profileId);
  const myConvs = ((mine as { conversation_id: string }[] | null) ?? []).map((r) => r.conversation_id);
  let cid: string | null = null;
  if (myConvs.length > 0) {
    const { data: shared } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("profile_id", input.to)
      .in("conversation_id", myConvs)
      .limit(1);
    cid = (shared as { conversation_id: string }[] | null)?.[0]?.conversation_id ?? null;
  }
  if (!cid) {
    cid = crypto.randomUUID();
    const { error: convErr } = await supabase.from("conversations").insert({ id: cid, last_message_at: new Date().toISOString() });
    if (convErr) return apiError("DB", convErr.message, 500);
    const { error: partErr } = await supabase.from("conversation_participants").insert([
      { conversation_id: cid, profile_id: profileId },
      { conversation_id: cid, profile_id: input.to }
    ]);
    if (partErr) return apiError("DB", partErr.message, 500);
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: cid,
      sender_id: profileId,
      body: original.body,
      artwork_id: original.artwork_id,
      forwarded_from: original.id
    })
    .select()
    .single();
  if (error) return apiError("DB", error.message, 500);
  await supabase.from("conversations").update({ last_message_at: data.created_at }).eq("id", cid);
  await notifyOthers(supabase, profileId, cid);
  return Response.json({ message: data, conversation_id: cid }, { status: 201 });
}

/** Notify the other participants (best-effort, never fails the send). */
async function notifyOthers(
  supabase: SupabaseClient,
  profileId: string,
  conversationId: string
) {
  try {
    const [{ data: me }, { data: parts }] = await Promise.all([
      supabase.from("profiles").select("name").eq("id", profileId).maybeSingle(),
      supabase.from("conversation_participants").select("profile_id").eq("conversation_id", conversationId).neq("profile_id", profileId)
    ]);
    const others = (parts as { profile_id: string }[] | null) ?? [];
    if (others.length === 0) return;
    const { data: owners } = await supabase.from("profiles").select("id,user_id").in("id", others.map((o) => o.profile_id));
    const notes = ((owners as { id: string; user_id: string }[] | null) ?? []).map((o) => ({
      user_id: o.user_id,
      actor_id: profileId,
      type: "message",
      title: "New message",
      body: `${(me as { name: string } | null)?.name ?? "Someone"} sent you a message.`,
      link: "/messages"
    }));
    if (notes.length > 0) {
      const admin = createAdminSupabase();
      await admin.from("notifications").insert(notes);
    }
  } catch { /* notifications optional */ }
}
