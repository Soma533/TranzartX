"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const STARTERS = [
  "How can I prepare for my first gallery application?",
  "Improve my artist statement.",
  "What should I add to my portfolio?",
  "What should I do next to achieve my career goal?"
];

interface Turn { role: "you" | "coach"; text: string; }

/** Contextual AI career assistant (PRD §21). Server injects profile/goals/works context. */
export default function AssistantPage() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setDraft("");
    setTurns((t) => [...t, { role: "you", text: q }]);
    setBusy(true);
    try {
      const r = await fetch("/api/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q })
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.answer) setTurns((t) => [...t, { role: "coach", text: j.answer as string }]);
      else setTurns((t) => [...t, { role: "coach", text: j?.error?.message ?? "Assistant unavailable right now." }]);
    } catch {
      setTurns((t) => [...t, { role: "coach", text: "Assistant unavailable right now." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <div>
        <h1 className="text-2xl font-bold">Career assistant</h1>
        <p className="text-sm text-muted-foreground">Advice tied to your profile, goals and portfolio — not generic tips.</p>
      </div>
      {turns.length === 0 && (
        <div className="grid gap-2">
          {STARTERS.map((s) => (
            <button key={s} onClick={() => ask(s)} className="rounded-xl border bg-white px-4 py-2 text-left text-sm hover:bg-secondary">
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-2">
        {turns.map((t, i) => (
          <Card key={i} className={t.role === "you" ? "border-primary/40" : ""}>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t.role === "you" ? "You" : "Coach"}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{t.text}</p>
          </Card>
        ))}
        {busy && <p className="animate-pulse text-sm text-muted-foreground">Thinking…</p>}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") ask(draft); }}
          placeholder="Ask about galleries, statements, portfolios…"
        />
        <Button onClick={() => ask(draft)} disabled={busy} className="sm:shrink-0">{busy ? "…" : "Ask"}</Button>
      </div>
    </div>
  );
}
