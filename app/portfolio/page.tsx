"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/lib/upload";
import { CollectionsManager } from "@/components/collections-manager";
import { useRef, useState } from "react";

interface ArtworkItem { id: string; title: string; image_url: string; collection_id: string | null; }

function Skeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border bg-white p-3">
          <div className="h-48 rounded-xl bg-secondary" />
          <div className="mt-2 h-4 w-2/3 rounded bg-secondary" />
        </div>
      ))}
    </div>
  );
}

export default function PortfolioPage() {
  const { push } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["artworks"],
    queryFn: async () => {
      const r = await fetch("/api/artworks");
      if (!r.ok) throw new Error("load failed");
      return r.json() as Promise<{ artworks: ArtworkItem[] }>;
    },
    retry: 1
  });
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function add() {
    if (!title.trim()) { push("Give the artwork a title"); return; }
    if (!file) { push("Choose an image to upload"); return; }
    setBusy(true);
    try {
      const url = await uploadImage(file);
      const r = await fetch("/api/artworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), image_url: url, price_cents: price ? Math.round(Number(price) * 100) : null })
      });
      if (!r.ok) {
        const j = await r.json().catch(() => null);
        throw new Error(j?.error?.message ?? "Could not save artwork");
      }
      push("Artwork published to your portfolio");
      setTitle(""); setPrice(""); setFile(null); setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["artworks"] });
    } catch (err) {
      push(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Portfolio</h1>
      <Card>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <div className="grid gap-2">
            <Input placeholder="Artwork title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
            <Input placeholder="Price in NGN (optional)" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <button onClick={() => fileRef.current?.click()} className="flex min-h-28 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-secondary/40 text-sm text-muted-foreground hover:bg-secondary">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Preview" className="h-28 w-full object-cover" />
            ) : (
              "Click to choose artwork image (JPG/PNG/WebP, ≤8 MB)"
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pick} />
          <Button onClick={add} disabled={busy} className="md:self-end">{busy ? "Publishing…" : "Publish artwork"}</Button>
        </div>
      </Card>
      <CollectionsManager artworks={data?.artworks ?? []} onChanged={() => qc.invalidateQueries({ queryKey: ["artworks"] })} />
      {isLoading && <Skeleton />}
      {isError && <p className="text-sm text-muted-foreground">Couldn&apos;t load your portfolio. Sign in, then refresh.</p>}
      {!isLoading && !isError && (
        <div className="grid gap-4 md:grid-cols-3">
          {(data?.artworks ?? []).map((a) => (
            <Card key={a.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.image_url} alt={a.title} className="h-48 w-full rounded-xl object-cover" loading="lazy" />
              <p className="mt-2 font-medium"><Link href={`/artworks/${a.id}`} className="hover:underline">{a.title}</Link></p>
            </Card>
          ))}
          {(data?.artworks ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No artworks yet — publish your first piece above.</p>
          )}
        </div>
      )}
    </div>
  );
}
