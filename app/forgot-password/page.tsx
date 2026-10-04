"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`
      });
      if (error) throw error;
      try { localStorage.setItem("reset-email", email); } catch { /* private mode */ }
      setMsg("Reset link sent — check your inbox.");
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Could not send reset link";
      setMsg(/rate limit/i.test(raw) ? "Too many reset emails sent — wait about an hour, then request once and use that link." : raw);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border bg-white p-8">
      <h1 className="text-xl font-bold">Reset password</h1>
      <p className="mt-1 text-sm text-muted-foreground">We&apos;ll email you a link to choose a new password.</p>
      <form onSubmit={submit} className="mt-4 grid gap-3">
        <Input placeholder="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</Button>
      </form>
      {msg && <p className="mt-3 text-sm text-muted-foreground">{msg}</p>}
    </div>
  );
}
