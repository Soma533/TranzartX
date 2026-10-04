"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SearchType = "artwork" | "artists" | "galleries" | "opportunities" | "collections";

export default function DiscoverPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<SearchType>("artwork");
  const [submitted, setSubmitted] = useState<{ q: string; type: SearchType } | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["search", submitted],
    queryFn: async () => {
      if (!submitted) return { results: [] };
      const r = await fetch(`/api/search?q=${encodeURIComponent(submitted.q)}&type=${submitted.type}`);
      return r.json() as Promise<{ results: { id: string; title?: string; name?: string }[] }>;
    },
    enabled: submitted !== null
  });
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Discover</h1>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search artists, artwork, galleries…" />
        <select value={type} onChange={(e) => setType(e.target.value as SearchType)} className="rounded-xl border px-2 text-sm">
          <option value="artwork">Artwork</option>
          <option value="artists">Artists</option>
          <option value="galleries">Galleries</option>
          <option value="opportunities">Opportunities</option>
          <option value="collections">Collections</option>
        </select>
        <Button onClick={() => setSubmitted({ q, type })}>Search</Button>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Searching…</p>}
      <div className="grid gap-3 md:grid-cols-3">
        {(data?.results ?? []).map((item) => (
          <Card key={item.id}><p className="text-sm font-medium">{item.title ?? item.name ?? item.id}</p></Card>
        ))}
      </div>
      {submitted && !isLoading && (data?.results ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">No results — try another term or category.</p>
      )}
    </div>
  );
}
