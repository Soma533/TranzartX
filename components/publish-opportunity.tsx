"use client";
import { useState } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function PublishOpportunityForm({ onDone }: { onDone?: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("OPEN_CALL");
  const { push } = useToast();
  async function publish() {
    const r = await fetch("/api/opportunities", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, type })
    });
    if (r.ok) { push("Opportunity published"); setTitle(""); setDescription(""); onDone?.(); }
    else push("Publish failed — galleries/orgs only, check title + description");
  }
  return (
    <Card>
      <p className="font-medium">Publish opportunity (galleries / orgs)</p>
      <div className="mt-2 grid gap-2">
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input placeholder="Type: OPEN_CALL, RESIDENCY, GRANT…" value={type} onChange={(e) => setType(e.target.value)} />
        <Textarea rows={3} placeholder="Description, eligibility, deadline…" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Button onClick={publish}>Publish</Button>
      </div>
    </Card>
  );
}
