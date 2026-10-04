"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Collection { id: string; title: string; description: string | null; }
interface ArtworkLite { id: string; title: string; collection_id: string | null; }

/** Create, view, assign and delete collections (PRD §13). */
export function CollectionsManager({ artworks, onChanged }: { artworks: ArtworkLite[]; onChanged: () => void }) {
  const { push } = useToast();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const { data } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const r = await fetch("/api/collections");
      if (!r.ok) return { collections: [] as Collection[] };
      return r.json() as Promise<{ collections: Collection[] }>;
    }
  });
  const collections = data?.collections ?? [];

  async function create() {
    if (!title.trim()) { push("Name the collection first"); return; }
    const r = await fetch("/api/collections", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() })
    });
    if (r.ok) { setTitle(""); push("Collection created"); qc.invalidateQueries({ queryKey: ["collections"] }); }
    else push("Create failed — sign in first");
  }

  async function remove(id: string) {
    if (!confirm("Delete this collection? Artworks stay in your portfolio.")) return;
    const r = await fetch(`/api/collections/${id}`, { method: "DELETE" });
    if (r.ok) { push("Collection deleted"); qc.invalidateQueries({ queryKey: ["collections"] }); onChanged(); }
    else push("Delete failed");
  }

  async function assign(artworkId: string, collectionId: string) {
    const r = await fetch(`/api/artworks/${artworkId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collection_id: collectionId || null })
    });
    if (r.ok) { push(collectionId ? "Added to collection" : "Removed from collection"); onChanged(); }
    else push("Move failed (owner only)");
  }

  return (
    <Card>
      <CardTitle>Collections</CardTitle>
      <p className="mt-1 text-sm text-muted-foreground">Group works the way galleries see them — e.g. “Fragments of Lagos”.</p>
      <div className="mt-2 flex gap-2">
        <Input placeholder="New collection title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        <Button variant="secondary" onClick={create}>Create</Button>
      </div>
      <div className="mt-3 grid gap-2">
        {collections.map((c) => {
          const members = artworks.filter((a) => a.collection_id === c.id);
          return (
            <div key={c.id} className="rounded-xl border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{c.title} <span className="text-muted-foreground">({members.length})</span></p>
                <button onClick={() => remove(c.id)} className="text-xs text-muted-foreground hover:text-foreground">Delete</button>
              </div>
              {members.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{members.map((m) => m.title).join(" · ")}</p>}
            </div>
          );
        })}
        {collections.length === 0 && <p className="text-sm text-muted-foreground">No collections yet.</p>}
      </div>
      {artworks.length > 0 && collections.length > 0 && (
        <div className="mt-3 grid gap-2">
          <p className="text-sm font-medium">Assign artworks</p>
          {artworks.map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{a.title}</span>
              <select
                value={a.collection_id ?? ""}
                onChange={(e) => assign(a.id, e.target.value)}
                className="rounded-lg border px-2 py-1 text-xs"
              >
                <option value="">No collection</option>
                {collections.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
