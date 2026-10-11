import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/logger";

type Person = { id: string; name: string; avatar_url: string | null; last_seen_at: string | null };
type MsgRow = {
  id: string; conversation_id: string; body: string; created_at: string;
  sender_id: string; deleted_at: string | null; read_at: string | null;
};

/**
 * Inbox: newest activity first, with last message + unread count per thread.
 * Three queries total (no per-thread round trips) so one failing lookup can
 * never blank out a contact name or message preview.
 */
export async function conversationList(supabase: SupabaseClient, profileId: string) {
  const { data, error } = await supabase
    .from("conversation_participants")
    .select("conversation_id,last_read_at,conversations!inner(id,last_message_at)")
    .eq("profile_id", profileId);
  if (error) {
    logger.error({ err: error, msg: "inbox list failed" });
    return apiError("DB", error.message, 500);
  }

  const rows = ((data as unknown as { conversation_id: string; last_read_at: string | null; conversations: { id: string; last_message_at: string | null } }[]) ?? [])
    .map((r) => ({
      conversation_id: r.conversation_id,
      last_read_at: r.last_read_at ?? null,
      last_message_at: r.conversations?.last_message_at ?? null
    }))
    .sort((a, b) => (b.last_message_at ?? "").localeCompare(a.last_message_at ?? ""));

  if (rows.length === 0) return Response.json({ conversations: [] });
  const ids = rows.map((r) => r.conversation_id);

  // Every other participant across all my threads, in a single pass.
  const [othersRes, msgsRes] = await Promise.all([
    supabase
      .from("conversation_participants")
      .select("conversation_id,profile_id, profiles!inner(id,name,avatar_url,last_seen_at)")
      .in("conversation_id", ids)
      .neq("profile_id", profileId),
    supabase
      .from("messages")
      .select("id,conversation_id,body,created_at,sender_id,deleted_at,read_at")
      .in("conversation_id", ids)
      .order("created_at", { ascending: false })
      .limit(1000)
  ]);
  if (othersRes.error) logger.error({ err: othersRes.error, msg: "inbox contacts failed" });
  if (msgsRes.error) logger.error({ err: msgsRes.error, msg: "inbox messages failed" });

  const personByConv = new Map<string, Person>();
  for (const row of (othersRes.data as unknown as { conversation_id: string; profiles: Person }[] | null) ?? []) {
    if (row.profiles && !personByConv.has(row.conversation_id)) {
      personByConv.set(row.conversation_id, row.profiles);
    }
  }

  const lastByConv = new Map<string, MsgRow>();
  const unreadByConv = new Map<string, number>();
  for (const m of (msgsRes.data as unknown as MsgRow[] | null) ?? []) {
    if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m);
    if (m.sender_id !== profileId && m.read_at === null) {
      unreadByConv.set(m.conversation_id, (unreadByConv.get(m.conversation_id) ?? 0) + 1);
    }
  }

  const conversations = rows.map((c) => {
    const last = lastByConv.get(c.conversation_id) ?? null;
    return {
      conversation_id: c.conversation_id,
      with: personByConv.get(c.conversation_id) ?? null,
      last_message: last
        ? { body: last.deleted_at ? "Message deleted" : last.body, created_at: last.created_at, mine: last.sender_id === profileId }
        : null,
      unread: unreadByConv.get(c.conversation_id) ?? 0,
      last_read_at: c.last_read_at
    };
  });
  return Response.json({ conversations });
}