"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NetworkPage() {
  const [people, setPeople] = useState<{ id: string; name: string; role: string }[]>([]);
  useEffect(() => {
    fetch("/api/network").then((r) => r.json()).then((j) => setPeople(j.suggestions ?? [])).catch(() => null);
  }, []);
  async function act(targetId: string, action: string) {
    await fetch("/api/network", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetId, action }) });
  }
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Professional Networking</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {people.map((p) => (
          <Card key={p.id}>
            <CardTitle>{p.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{p.role}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => act(p.id, "follow")}>Follow</Button>
              <Button variant="outline" onClick={() => act(p.id, "connect")}>Connect</Button>
              <Link href={`/messages?to=${p.id}`} className="inline-flex items-center rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">Message</Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
