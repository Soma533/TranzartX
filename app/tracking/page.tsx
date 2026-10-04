"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const STATUSES = ["SAVED", "CONSIDERING", "PREPARING", "APPLIED", "CONTACTED", "ACCEPTED", "REJECTED", "COMPLETED"];

export default function TrackingPage() {
  const [rows, setRows] = useState<{ opportunity_id: string; status: string; opportunities?: { title: string } }[]>([]);
  const { push } = useToast();
  async function load() {
    const j = await fetch("/api/tracking").then((r) => r.json()).catch(() => null);
    setRows(j?.tracking ?? []);
  }
  useEffect(() => { void load(); }, []);
  async function setStatus(oppId: string, status: string) {
    const r = await fetch("/api/opportunities", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ opportunity_id: oppId, status }) });
    push(r.ok ? `Moved to ${status}` : "Update failed");
    load();
  }
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Opportunity tracking</h1>
      {rows.map((r) => (
        <Card key={r.opportunity_id}>
          <p className="text-sm font-medium">{r.opportunities?.title ?? r.opportunity_id.slice(0, 8)} — {r.status}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {STATUSES.map((s) => (
              <Button key={s} variant={s === r.status ? "default" : "outline"} onClick={() => setStatus(r.opportunity_id, s)}>{s}</Button>
            ))}
          </div>
        </Card>
      ))}
      {rows.length === 0 && <p className="text-sm text-muted-foreground">Saved/applied opportunities will appear here.</p>}
    </div>
  );
}
