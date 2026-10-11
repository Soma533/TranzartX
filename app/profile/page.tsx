"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProfileSettings } from "@/app/settings/sections";
import type { SettingsForm } from "@/app/settings/fields";
import { useToast } from "@/hooks/use-toast";

const EMPTY: SettingsForm = {
  name: "", location_country: "", location_city: "", bio: "", statement: "", short_desc: "",
  career_stage: "", avatar_url: "", commission_open: false,
  collaboration_types: [],
  notify_matches: true, notify_saves: true, notify_deadlines: true,
  portfolio_public: true, show_prices: true,
  default_currency: "NGN", default_availability: "AVAILABLE",
  inquiries_open: true, inquiry_auto_reply: "", inquiry_response_time: "1-2 days"
};

/** Profile settings live on their own page, separate from other settings. */
export default function ProfileSettingsPage() {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SettingsForm>(EMPTY);

  useEffect(() => {
    fetch("/api/profiles/me")
      .then((r) => r.json())
      .then((j) => { if (j.profile) setForm((f) => ({ ...f, ...j.profile })); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof SettingsForm>(k: K, v: SettingsForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
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
      if (r.ok) push("Profile saved");
      else if (r.status === 401) push("Session expired — log in again, then retry");
      else {
        const j = await r.json().catch(() => null);
        push(j?.error?.message ?? "Save failed — try again");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading profile…</p>;

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">How you appear to collectors, galleries and collaborators.</p>
      </div>
      <ProfileSettings form={form} set={set} />
      <div>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
        <Button variant="outline" className="ml-2" onClick={() => router.back()}>Back</Button>
      </div>
    </div>
  );
}