"use client";
import { useRef, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field, Toggle, COLLAB_OPTIONS, type SettingsForm } from "@/app/settings/fields";
import { uploadImage } from "@/lib/upload";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";

interface Props {
  form: SettingsForm;
  set: <K extends keyof SettingsForm>(k: K, v: SettingsForm[K]) => void;
  toggleCollab: (opt: string) => void;
}

interface ProfileProps {
  form: SettingsForm;
  set: <K extends keyof SettingsForm>(k: K, v: SettingsForm[K]) => void;
}

/** Portfolio settings: how your body of work is presented and priced. */
export function PortfolioSettings({ form, set, toggleCollab }: Props) {
  return (
    <>
      <Card>
        <CardTitle>Portfolio visibility</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">Control how collectors and galleries see your work.</p>
        <div className="mt-2">
          <Toggle label="Show my portfolio publicly" checked={form.portfolio_public} onChange={(v) => set("portfolio_public", v)} />
          <Toggle label="Display prices on artworks" checked={form.show_prices} onChange={(v) => set("show_prices", v)} />
        </div>
      </Card>
      <Card>
        <CardTitle>Listing defaults</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">Applied to each new artwork you upload.</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Field label="Default currency">
            <select value={form.default_currency} onChange={(e) => set("default_currency", e.target.value)} className="rounded-xl border bg-background px-3 py-2 text-sm">
              <option value="NGN">NGN — Nigerian Naira</option>
              <option value="GHS">GHS — Ghanaian Cedi</option>
              <option value="ZAR">ZAR — South African Rand</option>
              <option value="KES">KES — Kenyan Shilling</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — Pound Sterling</option>
            </select>
          </Field>
          <Field label="Default availability">
            <select value={form.default_availability} onChange={(e) => set("default_availability", e.target.value)} className="rounded-xl border bg-background px-3 py-2 text-sm">
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="SOLD">Sold</option>
              <option value="NOT_FOR_SALE">Not for sale</option>
            </select>
          </Field>
        </div>
      </Card>
      <Card>
        <CardTitle>Availability</CardTitle>
        <div className="mt-2">
          <Toggle label="Open to commissions & collaborations" checked={form.commission_open} onChange={(v) => set("commission_open", v)} />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {COLLAB_OPTIONS.map((o) => (
            <button
              key={o}
              onClick={() => toggleCollab(o)}
              className={`rounded-full border px-3 py-1 text-xs ${form.collaboration_types.includes(o) ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {o}
            </button>
          ))}
        </div>
      </Card>
    </>
  );
}

/** Inquiry settings: whether you take purchase enquiries and how fast you reply. */
export function InquirySettings({ form, set }: { form: SettingsForm; set: Props["set"] }) {
  return (
    <>
      <Card>
        <CardTitle>Purchase enquiries</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">Collectors can contact you about any artwork you have listed.</p>
        <div className="mt-2">
          <Toggle label="Accept new inquiries" checked={form.inquiries_open} onChange={(v) => set("inquiries_open", v)} />
        </div>
      </Card>
      <Card>
        <CardTitle>Response expectations</CardTitle>
        <div className="mt-2 grid gap-2">
          <Field label="Typical reply time">
            <select value={form.inquiry_response_time} onChange={(e) => set("inquiry_response_time", e.target.value)} className="rounded-xl border bg-background px-3 py-2 text-sm">
              <option value="Within hours">Within hours</option>
              <option value="1-2 days">1-2 days</option>
              <option value="3-5 days">3-5 days</option>
              <option value="1 week">1 week</option>
            </select>
          </Field>
          <Field label="Auto-reply shown to enquirers (optional)">
            <Textarea rows={3} placeholder="e.g. Thanks for reaching out — I usually reply within a day." value={form.inquiry_auto_reply ?? ""} onChange={(e) => set("inquiry_auto_reply", e.target.value)} />
          </Field>
        </div>
      </Card>
    </>
  );
}

/** Appearance: light or dark theme. */
export function AppearanceSection() {
  const { theme, toggle } = useTheme();
  return (
    <Card>
      <CardTitle>Appearance</CardTitle>
      <p className="mt-1 text-sm text-muted-foreground">Choose how TranzartX looks on this device.</p>
      <div className="mt-3 flex gap-2">
        {(["light", "dark"] as const).map((option) => (
          <button
            key={option}
            onClick={() => { if (theme !== option) toggle(); }}
            aria-pressed={theme === option}
            className={`flex-1 rounded-xl border px-4 py-3 text-sm capitalize ${theme === option ? "border-primary bg-secondary font-semibold" : "text-muted-foreground"}`}
          >
            {theme === option ? "✓ " : ""}{option}
          </button>
        ))}
      </div>
    </Card>
  );
}

/** Profile settings, kept on their own page so they stay separate. */
export function ProfileSettings({ form, set }: ProfileProps) {
  const { push } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  async function avatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      set("avatar_url", await uploadImage(f, "avatars"));
      push("Photo uploaded — save to apply");
    } catch (err) {
      push(err instanceof Error ? err.message : "Photo upload failed");
    }
  }

  return (
    <>
      <Card>
        <CardTitle>Profile photo</CardTitle>
        <div className="mt-2 flex items-center gap-3">
          {form.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.avatar_url} alt="Avatar" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-lg font-bold">?</div>
          )}
          <label className="cursor-pointer rounded-xl border px-3 py-2 text-sm hover:bg-secondary">Upload photo</label>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={avatar} />
        </div>
      </Card>
      <Card>
        <CardTitle>Professional identity</CardTitle>
        <div className="mt-2 grid gap-2">
          <Field label="Full name">
            <Input placeholder="Full name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Country"><Input placeholder="Country" value={form.location_country ?? ""} onChange={(e) => set("location_country", e.target.value)} /></Field>
            <Field label="City"><Input placeholder="City" value={form.location_city ?? ""} onChange={(e) => set("location_city", e.target.value)} /></Field>
          </div>
          <Field label="Tagline (max 140 chars)">
            <Input placeholder="Tagline" value={form.short_desc ?? ""} onChange={(e) => set("short_desc", e.target.value)} maxLength={140} />
          </Field>
          <Field label="Career stage">
            <Input placeholder="e.g. Emerging" value={form.career_stage ?? ""} onChange={(e) => set("career_stage", e.target.value)} />
          </Field>
          <Field label="Biography">
            <Textarea rows={4} placeholder="Biography" value={form.bio ?? ""} onChange={(e) => set("bio", e.target.value)} />
          </Field>
          <Field label="Artist statement">
            <Textarea rows={4} placeholder="Artist statement" value={form.statement ?? ""} onChange={(e) => set("statement", e.target.value)} />
          </Field>
        </div>
      </Card>
    </>
  );
}