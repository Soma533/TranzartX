"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload";
import { useToast } from "@/hooks/use-toast";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

const COLLAB_OPTIONS = ["Joint exhibitions", "Art projects", "Photography", "Digital projects", "Installations", "Cross-disciplinary"];

/** Account + professional profile settings (PRD §7 progressive profile, §20 collabs, §24 prefs). */
export default function SettingsPage() {
  const router = useRouter();
  const { push } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", location_country: "", location_city: "", bio: "", statement: "", short_desc: "",
    career_stage: "", avatar_url: "", commission_open: false,
    collaboration_types: [] as string[],
    notify_matches: true, notify_saves: true, notify_deadlines: true
  });

  useEffect(() => {
    fetch("/api/profiles/me").then((r) => r.json()).then((j) => {
      if (j.profile) setForm((f) => ({ ...f, ...j.profile, collaboration_types: j.profile.collaboration_types ?? [] }));
    }).catch(() => null).finally(() => setLoading(false));
  }, []);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
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

  const [vKind, setVKind] = useState("IDENTITY");
  const [vEvidence, setVEvidence] = useState("");
  const [vRequests, setVRequests] = useState<{ id: string; kind: string; status: string }[]>([]);

  useEffect(() => {
    fetch("/api/verification").then((r) => r.json()).then((j) => setVRequests(j.requests ?? [])).catch(() => null);
  }, []);

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
      <Card>
        <CardTitle>Profile photo</CardTitle>
        <div className="mt-2 flex items-center gap-3">
          {form.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.avatar_url} alt="Avatar" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary font-bold">?</div>
          )}
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>Upload photo</Button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={avatar} />
        </div>
      </Card>
      <Card>
        <CardTitle>Professional identity</CardTitle>
        <div className="mt-2 grid gap-2">
          <Input placeholder="Full name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Country" value={form.location_country ?? ""} onChange={(e) => set("location_country", e.target.value)} />
            <Input placeholder="City" value={form.location_city ?? ""} onChange={(e) => set("location_city", e.target.value)} />
          </div>
          <Input placeholder="Tagline (max 140 chars)" value={form.short_desc ?? ""} onChange={(e) => set("short_desc", e.target.value)} maxLength={140} />
          <Input placeholder="Career stage (e.g. Emerging)" value={form.career_stage ?? ""} onChange={(e) => set("career_stage", e.target.value)} />
          <Textarea rows={4} placeholder="Biography" value={form.bio ?? ""} onChange={(e) => set("bio", e.target.value)} />
          <Textarea rows={4} placeholder="Artist statement" value={form.statement ?? ""} onChange={(e) => set("statement", e.target.value)} />
        </div>
      </Card>
      <Card>
        <CardTitle>Availability</CardTitle>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.commission_open} onChange={(e) => set("commission_open", e.target.checked)} />
          Open to commissions & collaborations
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {COLLAB_OPTIONS.map((o) => (
            <button
              key={o}
              onClick={() => toggleCollab(o)}
              className={`rounded-full border px-3 py-1 text-xs ${form.collaboration_types.includes(o) ? "bg-primary text-white" : "bg-white text-muted-foreground"}`}
            >
              {o}
            </button>
          ))}
        </div>
      </Card>
      <Card>
        <CardTitle>Notifications</CardTitle>
        {[["notify_matches", "New opportunities matching my goals"], ["notify_saves", "Someone saves my artwork"], ["notify_deadlines", "Application deadline reminders"]].map(([k, label]) => (
          <label key={k} className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form[k as "notify_matches"]} onChange={(e) => set(k as "notify_matches", e.target.checked)} />
            {label}
          </label>
        ))}
      </Card>
      <Card>
        <CardTitle>Verification</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">Verified profiles earn buyer and gallery trust. Tell us what to verify.</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <select value={vKind} onChange={(e) => setVKind(e.target.value)} className="rounded-xl border px-2 py-2 text-sm">
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
      <div className="flex flex-wrap gap-2">
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
        <Button variant="outline" onClick={signOut}>Sign out</Button>
      </div>
    </div>
  );
}
