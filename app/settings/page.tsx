"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ProfileSettings, PortfolioSettings, InquirySettings } from "@/app/settings/sections";
import type { SettingsForm } from "@/app/settings/fields";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "portfolio", label: "Portfolio" },
  { id: "inquiries", label: "Inquiries" }
] as const;

type TabId = (typeof TABS)[number]["id"];

const EMPTY: SettingsForm = {
  name: "", location_country: "", location_city: "", bio: "", statement: "", short_desc: "",
  career_stage: "", avatar_url: "", commission_open: false,
  collaboration_types: [],
  notify_matches: true, notify_saves: true, notify_deadlines: true,
  portfolio_public: true, show_prices: true,
  default_currency: "NGN", default_availability: "AVAILABLE",
  inquiries_open: true, inquiry_auto_reply: "", inquiry_response_time: "1-2 days"
};

/** Profile, portfolio and inquiry settings, grouped into tabs (PRD §7). */
export default function SettingsPage() {
  const router = useRouter();
  const { push } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<TabId>("profile");
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
          ...f,
          ...p,
          collaboration_types: (p.collaboration_types as string[]) ?? [],
          inquiry_auto_reply: (p.inquiry_auto_reply as string) ?? "",
          default_currency: (p.default_currency as string) ?? "NGN",
          default_availability: (p.default_availability as string) ?? "AVAILABLE",
          inquiry_response_time: (p.inquiry_response_time as string) ?? "1-2 days"
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

  async function avatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = await uploadImage(f, "avatars");
      set("avatar_url", url);
      push("Photo uploaded — save to apply");
    } catch (err) {
      push(err instanceof Error ? err.message : "Photo upload failed");
    }
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
    if (form.name.trim().length < 2) { push("Name needs at least 2 characters"); return; }
    setSaving(true);
    try {
      const payload = Object.fromEntries(
        Object.entries({ ...form, name: form.name.trim() }).map(([k, v]) => [k, v === "" ? undefined : v])
      );
      const r = await fetch("/api/profiles/me", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (r.ok) {
        push("Settings saved");
      } else if (r.status === 401) {
        push("Session expired — log in again, then retry");
      } else {
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

      <div role="tablist" aria-label="Settings sections" className="flex gap-1 rounded-xl border p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${tab === t.id ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <ProfileSettings
          form={form} set={set} fileRef={fileRef} onAvatar={avatar}
          vKind={vKind} setVKind={setVKind} vEvidence={vEvidence} setVEvidence={setVEvidence}
          onRequestVerification={requestVerification} vRequests={vRequests}
        />
      )}
      {tab === "portfolio" && <PortfolioSettings form={form} set={set} toggleCollab={toggleCollab} />}
      {tab === "inquiries" && <InquirySettings form={form} set={set} />}

      <div className="flex flex-wrap gap-2">
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
        <Button variant="outline" onClick={signOut}>Sign out</Button>
      </div>
    </div>
  );
}