"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GoalsPage() {
  const [goals, setGoals] = useState<{ id: string; goal_type: string }[]>([]);
  const [items, setItems] = useState<{ id: string; title: string; status: string }[]>([]);
  async function load() {
    const g = await fetch("/api/goals").then((r) => r.json()).catch(() => null);
    setGoals(g?.goals ?? []);
    const t = await fetch("/api/roadmap").then((r) => r.json()).catch(() => null);
    setItems(t?.items ?? []);
  }
  useEffect(() => { void load(); }, []);
  async function addGoal(type: string) {
    await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goal_type: type }) });
    load();
  }
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Career goals & roadmap</h1>
      <div className="flex flex-wrap gap-2">
        {["FIRST_EXHIBITION", "FIRST_SALE", "FIND_GALLERY", "INTERNATIONAL"].map((t) => (
          <Button key={t} variant="secondary" onClick={() => addGoal(t)}>{t.replaceAll("_", " ")}</Button>
        ))}
      </div>
      <div className="grid gap-2">
        {items.map((i) => (
          <Card key={i.id}>
            <p className="text-sm">{i.status === "DONE" ? "✓ " : "○ "}{i.title}</p>
          </Card>
        ))}
        {goals.length === 0 && <p className="text-sm text-muted-foreground">No goals yet — pick one above.</p>}
      </div>
    </div>
  );
}
