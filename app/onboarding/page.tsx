"use client";
import { useState } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [raw, setRaw] = useState("");
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState("");

  async function save() {
    const r = await fetch("/api/profiles/me", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, location_country: country, disciplines: discipline ? [discipline] : [], bio: draft || undefined })
    });
    if (r.ok) {
      setMsg("Profile saved — welcome to TranzartX.");
    } else if (r.status === 401) {
      setMsg("Session expired — log in again, then retry.");
    } else {
      const j = await r.json().catch(() => null);
      setMsg(j?.error?.message ?? "Save failed. Check name (min 2 chars).");
    }
  }

  async function assist() {
    setDraft("");
    const r = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "bio", rawText: raw }) });
    const j = await r.json();
    if (r.ok) setDraft(j.draft);
    else setMsg(j.error?.message ?? "AI is disabled — describe yourself manually; you stay in control.");
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <h1 className="text-2xl font-bold">Quick onboarding</h1>
      <Card>
        <div className="grid gap-2">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Country (e.g. Nigeria)" value={country} onChange={(e) => setCountry(e.target.value)} />
          <Input placeholder="Discipline (e.g. Painting)" value={discipline} onChange={(e) => setDiscipline(e.target.value)} />
        </div>
      </Card>
      <Card>
        <p className="font-medium">Describe yourself naturally</p>
        <Textarea rows={4} value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="I'm a young painter from Lagos…" />
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" onClick={assist}>Generate professional bio (AI)</Button>
          <Button onClick={save}>Save profile</Button>
        </div>
        {draft && <Textarea rows={5} className="mt-2" value={draft} onChange={(e) => setDraft(e.target.value)} />}
        {msg && <p className="mt-2 text-sm text-muted-foreground">{msg}</p>}
      </Card>
    </div>
  );
}
