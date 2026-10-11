"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { PortfolioSettings, InquirySettings, AppearanceSection } from "@/app/settings/sections";
import { Toggle, type SettingsForm } from "@/app/settings/fields";

const TABS = [
  { id: "portfolio", label: "Portfolio" },
  { id: "inquiries", label: "Inquiries" },
  { id: "account", label: "Account" }
] as const;

type TabId = (typeof TABS)[number]["id"];

const NOTIFY_PREFS = [
  ["notify_matches", "New opportunities matching my goals"],
  ["notify_saves", "Someone saves my artwork"],
  ["notify_deadlines", "Application deadline reminders"]
] as const;

const EMPTY: SettingsForm = {
  name: "", location_country: "", location_city: "", bio: "", statement: "", short_desc: "",
  career_stage: "", avatar_url: "", commission_open: false,
  collaboration_types: [],
  notify_matches: true, notify_saves: true, notify_deadlines: true,
  portfolio_public: true, show_prices: true,
  default_currency: "NGN", default_availability: "AVAILABLE",
  inquiries_open: true, inquiry_auto_reply: "", inquiry_response_time: "1-2 days"
};

/** Everything except profile details, which have their own /profile page. */
export default function SettingsPage() {
  const router = useRouter();
  const { push } = useToast();
  const [tab, setTab] = useState<TabId>("portfolio");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SettingsForm>(EMPTY);
  const [vKind, setVKind] = useState("IDENTITY");
  const [vEvidence, setVEvidence] = useState("");
  const [vRequests, setVRequests] = useState<{ id: string; kind: string; status: string }[]>([]);

  useEffect(() => {
    fetch("/api/profiles/me").then((r) => r.json()).then((j) => {
      if (j.profile) {
        const p = j.profile as Record<string, unknown>;
        setForm((f) => ({
          ...f, ...p,
          collaboration_types: (p.collaboration_types as string[]) ?? [],
          inquiry_auto_reply: (p.inquiry_auto_reply as string) ?? ""
        }));
      }
    }).catch(() => null).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/verification").then((r) => r.json()).then((j) => setVRequests(j.requests ?? [])).catch(() => null);
  }, []);

  function set<K extends keyof SettingsForm>(k: K, v: SettingsForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleCollab(opt: string) {
    setForm((f) => ({
      ...f,
      collaboration_types: f.collaboration_types.includes(opt)
        ? f.collaboration_types.filter((c) => c !== opt)
        : [...f.collaboration_types, opt]
    }));
  }

  async function requestVerification() {
    const r = await fetch("/api/verification", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: vKind, evidence: vEvidence })
    });
    if (r.ok) {
      push("Verification requested — we review within a few days");
      setVEvidence("");
      fetch("/api/verification").then((x) => x.json()).then((j) => setVRequests(j.requests ?? [])).catch(() => null);
    } else {
      const j = await r.json().catch(() => null);
      push(j?.error?.message ?? "Request failed");
    }
  }

  async function save() {
    setSaving(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === "" ? undefined : v])
      );
      const r = await fetch("/api/profiles/me", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (r.ok) push("Settings saved");
      else if (r.status === 401) push("Session expired — log in again, then retry");
      else {
        const j = await r.json().catch(() => null);
        push(j?.error?.message ?? "Save failed — try again");
      }
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/");
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading settings…</p>;

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Link href="/profile" className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm hover:bg-secondary">
        <span><span className="font-medium">Profile</span><span className="block text-xs text-muted-foreground">Photo, name, bio and artist statement</span></span>
        <span aria-hidden>→</span>
      </Link>

      <div role="tablist" aria-label="Settings sections" className="flex gap-1 rounded-xl border p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "portfolio" && <PortfolioSettings form={form} set={set} toggleCollab={toggleCollab} />}
      {tab === "inquiries" && <InquirySettings form={form} set={set} />}
      {tab === "account" && (
        <>
          <AppearanceSection />
          <Card>
            <CardTitle>Notifications</CardTitle>
            {NOTIFY_PREFS.map(([k, label]) => (
              <Toggle key={k} label={label} checked={form[k]} onChange={(v) => set(k, v)} />
            ))}
          </Card>
          <Card>
            <CardTitle>Verification</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Verified profiles earn buyer and gallery trust. Tell us what to verify.</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <select value={vKind} onChange={(e) => setVKind(e.target.value)} className="rounded-xl border bg-background px-2 py-2 text-sm">
                <option value="IDENTITY">Artist identity</option>
                <option value="EXHIBITION">Exhibition history</option>
                <option value="GALLERY">Gallery affiliation</option>
                <option value="ORGANIZATION">Organization</option>
              </select>
              <Input placeholder="Evidence (link or reference)" value={vEvidence} onChange={(e) => setVEvidence(e.target.value)} />
              <Button variant="secondary" onClick={requestVerification} className="sm:shrink-0">Request</Button>
            </div>
            {vRequests.map((v) => (
              <p key={v.id} className="mt-1 text-xs text-muted-foreground">{v.kind} — {v.status}</p>
            ))}
          </Card>
        </>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
        <Button variant="outline" onClick={signOut}>Sign out</Button>
      </div>
    </div>
  );
}