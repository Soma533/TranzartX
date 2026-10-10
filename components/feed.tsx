"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

interface Author {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface FeedArtwork {
  id: string;
  title: string;
  image_url: string;
  medium: string | null;
  price_cents: number | null;
  currency: string | null;
  availability: string | null;
  artist_id: string;
  profiles: Author | null;
}

interface FeedOpp {
  id: string;
  title: string;
  type: string;
  location: string | null;
  deadline: string | null;
  org_id: string;
  profiles: Author | null;
}

function Avatar({ author }: { author: Author | null }) {
  if (author?.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={author.avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">
      {(author?.name ?? "?").slice(0, 1)}
    </span>
  );
}

function byline(author: Author | null, fallbackId: string) {
  if (!author) return <span className="text-sm text-muted-foreground">Artist</span>;
  return (
    <Link href={`/artists/${author.id}`} className="text-sm font-medium text-primary hover:underline">
      {author.name}
    </Link>
  );
}

/** Latest artwork shared by other members, responsive 2-up on phones, 3-up wider. */
export function ArtworkFeed() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["feed", "artworks"],
    queryFn: async () => {
      const r = await fetch("/api/feed");
      if (!r.ok) throw new Error("feed failed");
      return r.json() as Promise<{ artworks: FeedArtwork[]; opportunities: FeedOpp[] }>;
    },
    retry: 1
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading what&apos;s new…</p>;
  if (isError) return <p className="text-sm text-muted-foreground">Couldn&apos;t load the feed right now.</p>;

  const items = data?.artworks ?? [];
  if (items.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">
          No artwork from the community yet. Share your first piece — it will appear here for everyone.
        </p>
        <Link href="/portfolio" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
          Go to my portfolio →
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {items.map((a) => (
        <Card key={a.id} className="overflow-hidden p-0">
          <Link href={`/artworks/${a.id}`} className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.image_url} alt={a.title} className="h-40 w-full object-cover sm:h-48" loading="lazy" />
          </Link>
          <div className="flex flex-col gap-1 p-3">
            <p className="truncate text-sm font-medium">
              <Link href={`/artworks/${a.id}`} className="hover:underline">{a.title}</Link>
            </p>
            {a.medium && <p className="truncate text-xs text-muted-foreground">{a.medium}</p>}
            <div className="mt-1 flex items-center gap-2">
              <Avatar author={a.profiles ?? null} />
              <div className="min-w-0">
                {byline(a.profiles ?? null, a.artist_id)}
                {a.price_cents != null && (
                  <p className="text-xs text-muted-foreground">
                    {a.currency ?? "NGN"} {(a.price_cents / 100).toLocaleString()}
                    {a.availability && a.availability !== "AVAILABLE" ? ` · ${a.availability.replaceAll("_", " ").toLowerCase()}` : ""}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/** Recent opportunities posted by organisations, for signed-in members. */
export function OpportunityFeed() {
  const [opps, setOpps] = useState<FeedOpp[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/feed")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setOpps(j.opportunities ?? []);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  if (!loaded) return null;
  if (opps.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {opps.map((o) => (
        <Card key={o.id}>
          <p className="text-xs uppercase tracking-widest text-primary">{o.type.replaceAll("_", " ")}</p>
          <p className="mt-1 font-medium">
            <Link href={`/opportunities/${o.id}`} className="hover:underline">{o.title}</Link>
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Avatar author={o.profiles ?? null} />
            <div className="min-w-0">
              {o.profiles ? byline(o.profiles, o.org_id) : <span className="text-sm text-muted-foreground">Organisation</span>}
              {o.deadline && (
                <p className="text-xs text-muted-foreground">Closes {new Date(o.deadline).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}