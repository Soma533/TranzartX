"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { FollowStats } from "@/components/follow-stats";

interface Props { profileId: string; }

/**
 * Instagram-style profile header: avatar, name, handle, stats row and bio.
 * Shown above the public portfolio on any member's page.
 */
export function ProfileHeader({ profileId }: Props) {
  const [data, setData] = useState<{
    name: string; short_desc: string | null; bio: string | null;
    location_city: string | null; location_country: string | null;
    career_stage: string | null; avatar_url: string | null; is_verified: boolean;
  } | null>(null);
  const [posts, setPosts] = useState<{ id: string; title: string; image_url: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/profiles/${profileId}`).then((r) => r.json()).then((j) => {
      if (cancelled) return;
      if (j?.profile) setData(j.profile);
      if (Array.isArray(j?.artworks)) setPosts(j.artworks);
    }).catch(() => null);
    return () => { cancelled = true; };
  }, [profileId]);

  if (!data) return null;
  const handle = `@${data.name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "")}`;

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-8">
        {data.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.avatar_url} alt={data.name} className="h-24 w-24 shrink-0 rounded-full object-cover sm:h-28 sm:w-28" />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-secondary text-3xl font-bold sm:h-28 sm:w-28">
            {data.name.slice(0, 1)}
          </div>
        )}

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex flex-col items-center gap-1 sm:flex-row sm:items-center sm:gap-3">
            <h1 className="text-xl font-bold">{data.name}</h1>
            {data.is_verified && <span className="text-primary" title="Verified">✓</span>}
            <p className="text-sm text-muted-foreground">{handle}</p>
          </div>

          <div className="mt-3 flex justify-center gap-6 sm:justify-start">
            <span className="text-center">
              <span className="block text-lg font-bold">{posts.length}</span>
              <span className="text-xs text-muted-foreground">posts</span>
            </span>
            <FollowStats profileId={profileId} />
          </div>

          <div className="mt-3 space-y-1 text-sm">
            {data.career_stage && <p className="font-semibold">{data.career_stage}</p>}
            <p className="text-muted-foreground">
              {[data.location_city, data.location_country].filter(Boolean).join(", ") || "Location not set"}
            </p>
            {data.short_desc && <p>{data.short_desc}</p>}
            {data.bio && <p className="whitespace-pre-wrap text-muted-foreground">{data.bio}</p>}
          </div>
        </div>
      </div>
    </Card>
  );
}