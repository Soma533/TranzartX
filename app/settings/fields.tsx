"use client";

export type SettingsForm = {
  name: string;
  location_country: string;
  location_city: string;
  bio: string;
  statement: string;
  short_desc: string;
  career_stage: string;
  avatar_url: string;
  commission_open: boolean;
  collaboration_types: string[];
  notify_matches: boolean;
  notify_saves: boolean;
  notify_deadlines: boolean;
  portfolio_public: boolean;
  show_prices: boolean;
  default_currency: string;
  default_availability: string;
  inquiries_open: boolean;
  inquiry_auto_reply: string;
  inquiry_response_time: string;
};

export const COLLAB_OPTIONS = ["Joint exhibitions", "Art projects", "Photography", "Digital projects", "Installations", "Cross-disciplinary"];

/** Settings field registry — one row of inputs, used by every section. */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 py-1 text-sm">
      <input type="checkbox" className="h-4 w-4" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}