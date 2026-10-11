"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Msg } from "@/components/chat-thread";
import type { Conversation } from "@/components/conversation-list";

/**
 * All messaging state and realtime wiring: inbox, thread, presence and the
 * conversation bootstrap (?to= deep link). Keeps the page component presentational.
 */
export function useMessages(push: (msg: string) => void) {
  const router = useRouter();
  const search = useSearchParams();
  const to = search.get("to");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [online, setOnline] = useState<Record<string, boolean>>({});
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => {
    fetch("/api/profiles/me").then((r) => r.json()).then((j) => {
      if (j.profile) setMyId(j.profile.id as string);
    }).catch(() => null);
  }, []);

  // Presence: record last seen, and broadcast online state to contacts.
  useEffect(() => {
    if (!myId) return;
    const beat = () => { fetch("/api/presence", { method: "POST" }).catch(() => null); };
    beat();
    const timer = setInterval(beat, 60_000);
    const supabase = createClient();
    const ch = supabase.channel(`presence-${myId}`, { config: { presence: { key: myId } } });
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState<{ profile_id: string; online_at: string }>();
      const next: Record<string, boolean> = {};
      for (const key of Object.keys(state)) next[key] = true;
      setOnline(next);
    }).subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ profile_id: myId, online_at: new Date().toISOString() });
      }
    });
    return () => {
      clearInterval(timer);
      void supabase.removeChannel(ch);
    };
  }, [myId]);

  const loadList = useCallback(async (select?: string) => {
    const r = await fetch("/api/messages");
    if (r.status === 401) { router.replace("/login"); return; }
    const j = await r.json().catch(() => null);
    const list = (j?.conversations ?? []) as Conversation[];
    setConversations(list);
    // Prefer an explicit selection, else keep the open thread, else the newest.
    setActive((prev) => select ?? prev ?? list[0]?.conversation_id ?? null);
  }, [router]);

  async function ensureConversation(targetId: string): Promise<string | null> {
    try {
      const r = await fetch("/api/messages/conversations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId })
      });
      if (r.status === 401) { push("Log in to message"); router.replace("/login"); return null; }
      const j = await r.json().catch(() => null);
      if (j?.conversation_id) return j.conversation_id as string;
      push(j?.error?.message ?? "Could not start conversation");
      return null;
    } catch {
      push("Could not start conversation");
      return null;
    }
  }

  useEffect(() => {
    // Deep link ?to=<profileId> starts (or reuses) a conversation — PRD §18.
    let cancelled = false;
    async function boot() {
      if (to) {
        setStarting(true);
        const cid = await ensureConversation(to);
        if (cancelled) return;
        if (cid) await loadList(cid);
        else await loadList();
        if (!cancelled) setStarting(false);
      } else {
        await loadList();
      }
    }
    void boot();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setLastReadAt(conversations.find((c) => c.conversation_id === active)?.last_read_at ?? null);
    fetch(`/api/messages?conversation=${active}`)
      .then((r) => {
        if (r.status === 401) { router.replace("/login"); return null; }
        return r.json();
      })
      .then((j) => { if (!cancelled && j) setMessages(j.messages ?? []); })
      .catch(() => null);

    const supabase = createClient();
    const ch = supabase.channel(`msg:${active}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${active}` }, (payload) => {
        const incoming = payload.new as Msg;
        // Dedupe against the server-confirmed append in send().
        setMessages((m) => (m.some((x) => x.id === incoming.id) ? m : [...m, incoming]));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${active}` }, (payload) => {
        // Tick flips, edits and deletes all arrive live without a refresh.
        const updated = payload.new as Msg;
        setMessages((m) => m.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
      })
      .subscribe();
    return () => { cancelled = true; void supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return {
    conversations, active, setActive, messages, setMessages,
    lastReadAt, starting, setStarting, myId, online, endRef,
    loadList, ensureConversation, to, router
  };
}