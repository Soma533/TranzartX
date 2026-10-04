"use client";
import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    fetch("/api/analytics").then((r) => r.json()).then(setStats).catch(() => null);
  }, []);
  const rows = stats ? Object.entries(stats) : [];
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Insights</h1>
      <p className="text-sm text-muted-foreground">Career signals, not vanity metrics (PRD §23/§32).</p>
      <div className="grid gap-3 md:grid-cols-3">
        {rows.map(([k, v]) => (
          <Card key={k}><CardTitle className="capitalize">{k.replace(/([A-Z])/g, " $1")}</CardTitle><p className="mt-1 text-2xl font-bold">{v}</p></Card>
        ))}
      </div>
      {!stats && <p className="text-sm text-muted-foreground">Sign in to see your professional activity.</p>}
    </div>
  );
}
