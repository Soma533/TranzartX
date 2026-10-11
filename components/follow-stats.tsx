"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Person {
  id: string;
  name: string;
  role: string | null;
  avatar_url: string | null;
  short_desc: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  ARTIST: "Artist", COLLECTOR: "Collector", GALLERY: "Gallery",
  CURATOR: "Curator", ORG: "Organisation", AESTHETE: "Aesthete"
};

/** Instagram-style "N followers / N following" that opens the full list. */
export function FollowStats({ profileId }: { profileId: string }) {
  const [tab, setTab] = useState<"followers" | "following" | null>(null);
  const [counts, setCounts] = useState<{ followers: number; following: number }>({ followers: 0, following: 0 });
  const [people, setPeople] = useState<Person[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = (relation: "followers" | "following") =>
      fetch(`/api/network/relationships?profileId=${profileId}&relation=${relation}`)
        .then((r) => r.json())
        .then((j) => {
          if (cancelled) return;
          setCounts((c) => ({ ...c, [relation]: j.count ?? 0 }));
          if (relation === tab) setPeople(j.people ?? []);
        })
        .catch(() => null);
    load("followers");
    load("following");
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  useEffect(() => {
    if (!tab) { setPeople(null); return; }
    let cancelled = false;
    fetch(`/api/network/relationships?profileId=${profileId}&relation=${tab}`)
      .then((r) => r.json())
      .then((j) => { if (!cancelled) setPeople(j.people ?? []); })
      .catch(() => null);
    return () => { cancelled = true; };
  }, [tab, profileId]);

  const label = (n: number, word: string) => (
    <button
      onClick={() => setTab(tab === word.toLowerCase() ? null : word.toLowerCase() as "followers" | "following")}
      className={`rounded-lg px-1.5 py-0.5 hover:bg-secondary ${tab === word.toLowerCase() ? "text-primary" : ""}`}
    >
      <span className="font-bold">{n}</span> {word}
    </button>
  );

  return (
    <>
      <div className="mt-2 flex gap-3 text-sm">
        {label(counts.followers, "followers")}
        {label(counts.following, "following")}
      </div>

      {tab && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setTab(null)}>
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={tab === "followers" ? "Followers" : "Following"}
          >
            <p className="border-b px-4 py-3 text-center text-sm font-semibold">
              {tab === "followers" ? "Followers" : "Following"}
            </p>
            <ul className="max-h-80 overflow-y-auto">
              {(people ?? []).map((p) => (
                <li key={p.id}>
                  <Link href={`/artists/${p.id}`} onClick={() => setTab(null)} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary font-semibold">
                        {p.name.slice(0, 1)}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{p.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {p.role ? ROLE_LABELS[p.role] ?? p.role : "Member"}
                        {p.short_desc ? ` · ${p.short_desc}` : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
              {people?.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                  {tab === "followers" ? "No followers yet." : "Not following anyone yet."}
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}