"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Person { id: string; name: string; role: string; }
interface ConnRequest { id: string; requester_id: string; profiles: { id: string; name: string; role: string }; }

export default function NetworkPage() {
  const router = useRouter();
  const { push } = useToast();
  const [people, setPeople] = useState<Person[]>([]);
  const [requests, setRequests] = useState<ConnRequest[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);

  async function load() {
    const me = await fetch("/api/profiles/me").then((r) => r.json()).catch(() => null);
    if (me?.profile) setMyId(me.profile.id as string);
    const j = await fetch("/api/network").then((r) => {
      if (r.status === 401) { router.replace("/login"); return null; }
      return r.json();
    }).catch(() => null);
    const all = (j?.suggestions ?? []) as Person[];
    setPeople(me?.profile ? all.filter((p) => p.id !== me.profile.id) : all);
    // Restore relationship state so "Following ✓" survives reloads and follows
    // made elsewhere (notifications, search) show correctly here.
    setFollowing(new Set((j?.following ?? []) as string[]));
    setRequested(new Set((j?.requested ?? []) as string[]));
    setConnected(new Set((j?.connected ?? []) as string[]));
    const t = await fetch("/api/network/requests").then((r) => r.json()).catch(() => null);
    setRequests(t?.requests ?? []);
  }

  useEffect(() => { void load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(targetId: string, action: "follow" | "unfollow" | "connect") {
    const r = await fetch("/api/network", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId, action })
    });
    if (r.status === 401) { push("Log in to network"); router.replace("/login"); return; }
    if (action === "follow" && r.ok) {
      setFollowing((s) => new Set(s).add(targetId));
      push("Following — they'll get a notification");
    } else if (action === "follow") {
      const j = await r.json().catch(() => null);
      push(j?.error?.message ?? "Follow failed");
    } else if (action === "unfollow" && r.ok) {
      setFollowing((s) => { const n = new Set(s); n.delete(targetId); return n; });
    } else if (action === "connect") {
      if (r.ok) {
        setRequested((s) => new Set(s).add(targetId));
        push("Request sent — they'll be notified");
      } else {
        const j = await r.json().catch(() => null);
        push(j?.error?.message ?? "Request failed");
      }
    }
  }

  async function review(id: string, action: "accept" | "decline") {
    const r = await fetch("/api/network/requests", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connection_id: id, action })
    });
    if (r.ok) {
      push(action === "accept" ? "Connected" : "Declined");
      setRequests((list) => list.filter((x) => x.id !== id));
    } else push("Update failed");
  }

  async function search() {
    if (!q.trim()) { load(); return; }
    setSearching(true);
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=people`);
      if (r.status === 401) { router.replace("/login"); return; }
      const j = await r.json().catch(() => null);
      const found = ((j?.results ?? []) as Person[]).filter((p) => p.id !== myId);
      setPeople(found);
      if (found.length === 0) push("No people found — try another name");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Professional Networking</h1>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") search(); }} placeholder="Search people by name…" />
        <Button onClick={search} disabled={searching} className="sm:shrink-0">{searching ? "…" : "Search"}</Button>
      </div>
      {requests.length > 0 && (
        <div className="grid gap-2">
          <h2 className="font-semibold">Connection requests ({requests.length})</h2>
          {requests.map((x) => (
            <Card key={x.id}>
              <p className="text-sm font-medium">{x.profiles.name} <span className="text-muted-foreground">· {x.profiles.role}</span></p>
              <div className="mt-2 flex gap-2">
                <Button variant="secondary" onClick={() => review(x.id, "accept")}>Accept</Button>
                <Button variant="outline" onClick={() => review(x.id, "decline")}>Decline</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {people.map((p) => (
          <Card key={p.id}>
            <CardTitle>{p.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{p.role}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {following.has(p.id) ? (
                <Button variant="outline" onClick={() => act(p.id, "unfollow")}>Following ✓</Button>
              ) : (
                <Button variant="secondary" onClick={() => act(p.id, "follow")}>Follow</Button>
              )}
              {requested.has(p.id) ? (
                <Button variant="outline" disabled>Requested ✓</Button>
              ) : connected.has(p.id) ? (
                <Button variant="outline" disabled>Connected ✓</Button>
              ) : (
                <Button variant="outline" onClick={() => act(p.id, "connect")}>Connect</Button>
              )}
              <Link href={`/messages?to=${p.id}`} className="inline-flex items-center rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">Message</Link>
            </div>
          </Card>
        ))}
      </div>
      {people.length === 0 && <p className="text-sm text-muted-foreground">No people here yet — sign in, or try a search above.</p>}
    </div>
  );
}
