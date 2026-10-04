"use client";
import { useCallback, useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Opportunity } from "@/lib/db/types";
import { PublishOpportunityForm } from "@/components/publish-opportunity";

export default function OpportunitiesPage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [q, setQ] = useState("");
  const load = useCallback(async () => {
    const r = await fetch(`/api/opportunities${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const j = await r.json().catch(() => null);
    setItems(j?.opportunities ?? []);
  }, [q]);
  useEffect(() => { void load(); }, [load]);
  async function track(id: string, status: string) {
    await fetch("/api/opportunities", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ opportunity_id: id, status }) });
  }
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Opportunities Hub</h1>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Search exhibitions, residencies…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button onClick={load} className="sm:shrink-0">Search</Button>
      </div>
      <PublishOpportunityForm onDone={load} />
      <div className="grid gap-3">
        {items.map((o) => (
          <Card key={o.id}>
            <CardTitle><a href={`/opportunities/${o.id}`} className="hover:underline">{(o as { title: string }).title}</a></CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{o.type} · {o.location ?? "—"} · {o.deadline ? new Date(o.deadline).toLocaleDateString() : "Rolling"}</p>
            <p className="mt-2 text-sm">{o.description.slice(0, 220)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => track(o.id, "SAVED")}>Save</Button>
              <Button variant="outline" onClick={() => track(o.id, "APPLIED")}>Mark applied</Button>
            </div>
          </Card>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">No opportunities yet — galleries can publish from the Upload tab.</p>}
      </div>
    </div>
  );
}
