import { messageSchema } from "@/schemas";
import { requireUser } from "@/services/auth-guard";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { apiError } from "@/lib/logger";

export async function GET(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const conv = new URL(request.url).searchParams.get("conversation");
  if (conv) {
    const { data, error } = await supabase.from("messages").select("*").eq("conversation_id", conv).order("created_at");
    if (error) return apiError("DB", error.message, 500);
    return Response.json({ messages: data });
  }
  const { data, error } = await supabase.from("conversation_participants").select("conversation_id").eq("profile_id", profileId ?? "");
  if (error) return apiError("DB", error.message, 500);
  const convs = (data as { conversation_id: string }[] | null) ?? [];
  // Attach the other participant's name so the inbox reads like an inbox.
  const enriched = await Promise.all(convs.map(async (c) => {
    const { data: others } = await supabase
      .from("conversation_participants")
      .select("profile_id, profiles!inner(id,name)")
      .eq("conversation_id", c.conversation_id)
      .neq("profile_id", profileId ?? "");
    const o = (others as { profiles: { id: string; name: string } }[] | null)?.[0]?.profiles ?? null;
    return { conversation_id: c.conversation_id, with: o };
  }));
  return Response.json({ conversations: enriched });
}

export async function POST(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, profileId } = guard;
  const parsed = messageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION", parsed.error.message, 422);
  const { data, error } = await supabase.from("messages").insert({ ...parsed.data, sender_id: profileId }).select().single();
  if (error) return apiError("DB", error.message, 500);
  // Notify the other participants (best-effort, never fails the send).
  try {
    const [{ data: me }, { data: parts }] = await Promise.all([
      supabase.from("profiles").select("name").eq("id", profileId ?? "").maybeSingle(),
      supabase.from("conversation_participants").select("profile_id").eq("conversation_id", parsed.data.conversation_id).neq("profile_id", profileId ?? "")
    ]);
    const others = (parts as { profile_id: string }[] | null) ?? [];
    if (others.length > 0) {
      const { data: owners } = await supabase.from("profiles").select("id,user_id").in("id", others.map((o) => o.profile_id));
      const notes = ((owners as { id: string; user_id: string }[] | null) ?? []).map((o) => ({
        user_id: o.user_id,
        type: "message",
        title: "New message",
        body: `${(me as { name: string } | null)?.name ?? "Someone"} sent you a message.`,
        link: "/messages"
      }));
      if (notes.length > 0) {
        const admin = createAdminSupabase();
        await admin.from("notifications").insert(notes);
      }
    }
  } catch { /* notifications optional */ }
  return Response.json({ message: data }, { status: 201 });
}
