"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface OppDetail {
  id: string; type: string; title: string; description: string;
  location: string | null; deadline: string | null; disciplines: string[];
  profiles?: { id: string; name: string };
}

function deadlineLabel(deadline: string | null): string {
  if (!deadline) return "Rolling — no fixed deadline";
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms < 0) return "Deadline passed";
  const days = Math.floor(ms / 86_400_000);
  return days === 0 ? "Closes today" : `${days} day${days === 1 ? "" : "s"} left (closes ${new Date(deadline).toLocaleDateString()})`;
}

/** Opportunity detail with match explanation + tracking actions (PRD §15–17). */
export default function OpportunityDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { push } = useToast();
  const [opp, setOpp] = useState<OppDetail | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    fetch(`/api/opportunities/${id}`)
      .then((r) => {
        if (!r.ok) { setMissing(true); return null; }
        return r.json();
      })
      .then((j) => {
        if (!j) return;
        setOpp(j.opportunity);
        setReasons(j.matchReasons ?? []);
        setStatus(j.trackingStatus);
      })
      .catch(() => setMissing(true));
  }, [id]);

  async function track(s: string) {
    const r = await fetch("/api/opportunities", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunity_id: id, status: s })
    });
    if (r.ok) { setStatus(s); push(`Marked as ${s.toLowerCase()}`); }
    else push("Update failed — sign in first");
  }

  if (missing) return <p className="text-sm text-muted-foreground">Opportunity not found — it may have been removed.</p>;
  if (!opp) return <p className="animate-pulse text-sm text-muted-foreground">Loading opportunity…</p>;

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <Card>
        <p className="text-xs uppercase tracking-widest text-primary">{opp.type.replaceAll("_", " ")}</p>
        <CardTitle>{opp.title}</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          {opp.location ?? "Location not specified"} · {deadlineLabel(opp.deadline)}
        </p>
        {opp.profiles && (
          <p className="mt-1 text-sm">Published by <span className="font-medium">{opp.profiles.name}</span></p>
        )}
        <p className="mt-3 text-sm whitespace-pre-wrap">{opp.description}</p>
        {opp.disciplines?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {opp.disciplines.map((d) => (
              <span key={d} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{d}</span>
            ))}
          </div>
        )}
      </Card>
      {reasons.length > 0 && (
        <Card>
          <CardTitle>Why this matches you</CardTitle>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </Card>
      )}
      <Card>
        <CardTitle>Track this opportunity</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">Current status: {status ?? "not tracked yet"}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {["SAVED", "CONSIDERING", "PREPARING", "APPLIED"].map((s) => (
            <Button key={s} variant={status === s ? "default" : "secondary"} onClick={() => track(s)}>{s}</Button>
          ))}
          <Link href="/tracking" className="rounded-xl border px-4 py-2 text-sm font-medium">Open tracker</Link>
        </div>
      </Card>
    </div>
  );
}
