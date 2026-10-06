"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SearchType = "artwork" | "artists" | "galleries" | "opportunities" | "collections";

interface ResultItem {
  id: string;
  title?: string;
  name?: string;
  image_url?: string;
  avatar_url?: string | null;
  role?: string;
  type?: string;
  profiles?: { id: string; name: string };
}

function ResultCard({ item, type }: { item: ResultItem; type: SearchType }) {
  if (type === "artwork") {
    return (
      <Card>
        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.title ?? "Artwork"} className="h-48 w-full rounded-xl object-cover" loading="lazy" />
        )}
        <p className="mt-2 font-medium"><Link href={`/artworks/${item.id}`} className="hover:underline">{item.title ?? item.id}</Link></p>
        {item.profiles && (
          <p className="text-sm text-muted-foreground">by <Link href={`/artists/${item.profiles.id}`} className="text-primary hover:underline">{item.profiles.name}</Link></p>
        )}
      </Card>
    );
  }
  if (type === "artists" || type === "galleries") {
    return (
      <Card>
        <div className="flex items-center gap-3">
          {item.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.avatar_url} alt={item.name ?? ""} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary font-bold">{(item.name ?? "?").slice(0, 1)}</div>
          )}
          <div>
            <p className="font-medium"><Link href={`/artists/${item.id}`} className="hover:underline">{item.name ?? item.id}</Link></p>
            {item.role && <p className="text-xs text-muted-foreground">{item.role}</p>}
          </div>
        </div>
      </Card>
    );
  }
  if (type === "opportunities") {
    return (
      <Card>
        <p className="text-xs uppercase tracking-widest text-primary">{item.type?.replaceAll("_", " ")}</p>
        <p className="font-medium"><Link href={`/opportunities/${item.id}`} className="hover:underline">{item.title ?? item.id}</Link></p>
      </Card>
    );
  }
  return (
    <Card><p className="text-sm font-medium">{item.title ?? item.name ?? item.id}</p></Card>
  );
}

export default function DiscoverPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<SearchType>("artwork");
  const [submitted, setSubmitted] = useState<{ q: string; type: SearchType } | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["search", submitted],
    queryFn: async () => {
      if (!submitted) return { results: [] as ResultItem[] };
      const r = await fetch(`/api/search?q=${encodeURIComponent(submitted.q)}&type=${submitted.type}`);
      if (!r.ok) throw new Error("search failed");
      return r.json() as Promise<{ results: ResultItem[] }>;
    },
    enabled: submitted !== null,
    retry: 1
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
      {isError && <p className="text-sm text-muted-foreground">Search failed — sign in and try again.</p>}
      <div className="grid gap-3 md:grid-cols-3">
        {(data?.results ?? []).map((item) => (
          <ResultCard key={item.id} item={item} type={submitted?.type ?? "artwork"} />
        ))}
      </div>
      {submitted && !isLoading && !isError && (data?.results ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">
          No results — try another term, a different category, or leave the box empty to browse everything.
        </p>
      )}
    </div>
  );
}
