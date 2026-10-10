"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ResultItem {
  id: string;
  _type: "person" | "artwork" | "opportunity" | "collection";
  title?: string;
  name?: string;
  image_url?: string;
  avatar_url?: string | null;
  medium?: string | null;
  role?: string;
  type?: string;
  location?: string | null;
  deadline?: string | null;
  price_cents?: number | null;
  currency?: string | null;
  short_desc?: string | null;
  is_verified?: boolean;
  profiles?: { id: string; name: string } | null;
}

const ROLE_LABELS: Record<string, string> = {
  ARTIST: "Artist",
  COLLECTOR: "Collector",
  GALLERY: "Gallery",
  CURATOR: "Curator",
  ORG: "Organisation",
  AESTHETE: "Aesthete",
  ADMIN: "Admin"
};

const KIND_LABELS: Record<ResultItem["_type"], string> = {
  artwork: "Artwork",
  person: "Member",
  opportunity: "Opportunity",
  collection: "Collection"
};

function ResultCard({ item }: { item: ResultItem }) {
  const badge = (text: string) => (
    <p className="text-xs uppercase tracking-widest text-primary">{text}</p>
  );

  if (item._type === "artwork") {
    return (
      <Card className="overflow-hidden p-0">
        {item.image_url && (
          <Link href={`/artworks/${item.id}`} className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image_url} alt={item.title ?? "Artwork"} className="h-40 w-full object-cover sm:h-48" loading="lazy" />
          </Link>
        )}
        <div className="p-3">
          {badge(KIND_LABELS.artwork)}
          <p className="mt-1 truncate font-medium"><Link href={`/artworks/${item.id}`} className="hover:underline">{item.title ?? item.id}</Link></p>
          {item.profiles && (
            <p className="text-sm text-muted-foreground">by <Link href={`/artists/${item.profiles.id}`} className="text-primary hover:underline">{item.profiles.name}</Link></p>
          )}
          {item.price_cents != null && (
            <p className="text-sm text-muted-foreground">{item.currency ?? "NGN"} {(item.price_cents / 100).toLocaleString()}</p>
          )}
        </div>
      </Card>
    );
  }

  if (item._type === "person") {
    return (
      <Card>
        <div className="flex items-center gap-3">
          {item.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.avatar_url} alt={item.name ?? ""} className="h-12 w-12 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary font-bold">{(item.name ?? "?").slice(0, 1)}</div>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium">
              <Link href={`/artists/${item.id}`} className="hover:underline">{item.name ?? item.id}</Link>
              {item.is_verified && <span className="ml-1 text-primary" title="Verified">✓</span>}
            </p>
            {item.role && <p className="text-xs text-muted-foreground">{ROLE_LABELS[item.role] ?? item.role}</p>}
            {item.short_desc && <p className="truncate text-xs text-muted-foreground">{item.short_desc}</p>}
          </div>
        </div>
      </Card>
    );
  }

  if (item._type === "opportunity") {
    return (
      <Card>
        {badge(item.type?.replaceAll("_", " ") ?? KIND_LABELS.opportunity)}
        <p className="mt-1 font-medium"><Link href={`/opportunities/${item.id}`} className="hover:underline">{item.title ?? item.id}</Link></p>
        {item.deadline && <p className="text-xs text-muted-foreground">Closes {new Date(item.deadline).toLocaleDateString()}</p>}
      </Card>
    );
  }

  return (
    <Card>
      {badge(KIND_LABELS.collection)}
      <p className="mt-1 truncate font-medium">{item.title ?? item.id}</p>
    </Card>
  );
}

/** One search box across artworks, members, opportunities and collections. */
export default function DiscoverPage() {
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["search", "all", submitted],
    queryFn: async () => {
      const r = await fetch(`/api/search?type=all&q=${encodeURIComponent(submitted ?? "")}`);
      if (!r.ok) throw new Error("search failed");
      return r.json() as Promise<{ results: ResultItem[] }>;
    },
    enabled: submitted !== null,
    retry: 1
  });
  const results = data?.results ?? [];
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Discover</h1>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => { e.preventDefault(); setSubmitted(q); }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search artworks, artists, galleries, curators, organisations, opportunities…"
          aria-label="Search everything"
        />
        <Button type="submit">Search</Button>
      </form>
      <p className="text-xs text-muted-foreground">
        Searches artworks, members, opportunities and collections at once — no category needed.
      </p>
      {isLoading && <p className="text-sm text-muted-foreground">Searching…</p>}
      {isError && <p className="text-sm text-muted-foreground">Search failed — sign in and try again.</p>}
      {submitted !== null && !isLoading && !isError && (
        <p className="text-sm text-muted-foreground">
          {results.length} {results.length === 1 ? "result" : "results"}
          {submitted.trim() ? ` for “${submitted.trim()}”` : " across everything"}.
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((item) => (
          <ResultCard key={`${item._type}-${item.id}`} item={item} />
        ))}
      </div>
      {submitted !== null && !isLoading && !isError && results.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No results — try another term, or leave the box empty to browse everything.
        </p>
      )}
    </div>
  );
}