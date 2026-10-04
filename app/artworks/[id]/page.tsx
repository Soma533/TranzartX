"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ArtworkDetail {
  id: string; artist_id: string; title: string; description: string | null;
  image_url: string; price_cents: number | null; currency: string;
  profiles?: { id: string; name: string };
}

export default function ArtworkDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [art, setArt] = useState<ArtworkDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [ar, me] = await Promise.all([
        fetch(`/api/artworks/${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch("/api/profiles/me").then((r) => r.json()).catch(() => null)
      ]);
      if (cancelled) return;
      if (!ar?.artwork) { setNotFound(true); return; }
      setArt(ar.artwork as ArtworkDetail);
      if (me?.profile) setIsOwner(me.profile.id === (ar.artwork as ArtworkDetail).artist_id);
    }
    void load();
    return () => { cancelled = true; };
  }, [id]);

  async function buy() {
    setBusy(true);
    try {
      const r = await fetch("/api/payments/paystack/init", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ artworkId: id }) });
      const j = await r.json();
      if (r.ok && j.link) window.location.href = j.link as string;
      else push(j.error?.message ?? "Payment init failed — artwork may have no price");
    } finally {
      setBusy(false);
    }
  }

  async function inquire() {
    if (!msg.trim()) { push("Write a message first"); return; }
    const r = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ artwork_id: id, message: msg }) });
    push(r.ok ? "Inquiry sent to artist" : "Inquiry failed — sign in first");
    if (r.ok) setMsg("");
  }

  async function toggleSave() {
    if (saved) {
      await fetch(`/api/saves?artwork_id=${id}`, { method: "DELETE" });
      setSaved(false);
    } else {
      const r = await fetch("/api/saves", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ artwork_id: id }) });
      if (r.ok) setSaved(true);
      else push("Save failed — sign in first");
    }
  }

  async function remove() {
    if (!confirm("Delete this artwork permanently?")) return;
    const r = await fetch(`/api/artworks/${id}`, { method: "DELETE" });
    if (r.ok) { push("Artwork deleted"); window.location.href = "/portfolio"; }
    else push("Delete failed");
  }

  if (notFound) return <p className="text-sm text-muted-foreground">Artwork not found — it may have been removed.</p>;
  if (!art) return <p className="animate-pulse text-sm text-muted-foreground">Loading artwork…</p>;
  return (
    <div className="grid gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={art.image_url} alt={art.title} className="max-h-[480px] w-full rounded-2xl object-cover" />
      <Card>
        <CardTitle>{art.title}</CardTitle>
        {art.profiles && <Link href={`/artists/${art.profiles.id}`} className="mt-1 inline-block text-sm text-primary hover:underline">by {art.profiles.name}</Link>}
        <p className="mt-1 text-sm text-muted-foreground">{art.description ?? "No description yet."}</p>
        <p className="mt-2 text-sm font-medium">{art.price_cents ? `${(art.price_cents / 100).toLocaleString()} ${art.currency}` : "Price on request"}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input placeholder="Ask the artist / express interest…" value={msg} onChange={(e) => setMsg(e.target.value)} />
          <Button variant="secondary" onClick={inquire}>Contact</Button>
          <Button variant="outline" onClick={toggleSave}>{saved ? "Saved ✓" : "Save"}</Button>
          {!isOwner && <Button onClick={buy} disabled={busy}>{busy ? "Starting checkout…" : "Buy with Paystack"}</Button>}
          {isOwner && <Button variant="outline" onClick={remove}>Delete</Button>}
        </div>
      </Card>
    </div>
  );
}
