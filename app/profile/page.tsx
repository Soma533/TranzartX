"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  const [editing, setEditing] = useState(false);
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{editing ? "Edit profile" : form.name || "Profile"}</h1>
          <p className="text-sm text-muted-foreground">
            {editing ? "Update how you appear to collectors, galleries and collaborators." : "Your public profile."}
          </p>
        </div>
        <Button variant={editing ? "outline" : "default"} onClick={() => setEditing((e) => !e)}>
          {editing ? "Cancel" : "Edit profile"}
        </Button>
      </div>

      {!editing ? (
        <>
          <Card>
            <div className="flex items-center gap-4">
              {form.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-lg font-bold">
                  {form.name.slice(0, 1) || "?"}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold">{form.name || "Unnamed"}</p>
                <p className="text-sm text-muted-foreground">
                  {[form.location_city, form.location_country].filter(Boolean).join(", ") || "Location not set"}
                </p>
                {form.career_stage && <p className="text-xs text-muted-foreground">{form.career_stage}</p>}
              </div>
            </div>
            {form.short_desc && <p className="mt-3 text-sm">{form.short_desc}</p>}
          </Card>
          {form.bio && (
            <Card>
              <p className="text-sm font-semibold">Biography</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{form.bio}</p>
            </Card>
          )}
          {form.statement && (
            <Card>
              <p className="text-sm font-semibold">Artist statement</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{form.statement}</p>
            </Card>
          )}
        </>
      ) : (
        <>
          <ProfileSettings form={form} set={set} />
          <div>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
            <Button variant="outline" className="ml-2" onClick={() => router.back()}>Back</Button>
          </div>
        </>
      )}
    </div>
  );
}