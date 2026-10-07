"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type LinkState = "checking" | "need-email" | "ready" | "invalid";

/**
 * Password reset: accepts PKCE ?code= links and legacy ?token_hash= links,
 * exchanges them for a session, then sets the password.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [link, setLink] = useState<LinkState>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const tokenHash = params.get("token_hash");
    const token = params.get("token");
    const otp = tokenHash ?? token;
    const type = params.get("type") ?? "recovery";
    const supabase = createClient();
    let stored = "";
    try { stored = localStorage.getItem("reset-email") ?? ""; } catch { /* private mode */ }
    if (stored) setEmail(stored);
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        setLink(error ? "invalid" : "ready");
        if (error) setMsg("This reset link is invalid or expired — request a fresh one below.");
      });
      return;
    }
    // token_hash links verify without email; plaintext token links need it.
    if (tokenHash) {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "recovery" }).then(({ error }) => {
        setLink(error ? "invalid" : "ready");
        if (error) setMsg("This reset link is invalid or expired — request a fresh one below.");
      });
      return;
    }
    if (token) {
      if (stored) {
        supabase.auth.verifyOtp({ email: stored, token: token, type: type as "recovery" }).then(({ error }) => {
          setLink(error ? "invalid" : "ready");
          if (error) setMsg("This reset link is invalid or expired — request a fresh one below.");
        });
      } else {
        setLink("need-email");
      }
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setLink(data.session ? "ready" : "invalid");
    });
  }, []);

  async function verifyWithEmail(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const token = params.get("token");
    setBusy(true);
    try {
      const client = createClient();
      const { error } = tokenHash
        ? await client.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" })
        : await client.auth.verifyOtp({ email, token: token as string, type: "recovery" });
      if (error) throw error;
      setLink("ready");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setMsg("Password needs at least 8 characters."); return; }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.replace("/today");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Reset failed — request a new link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border bg-white p-8">
      <h1 className="text-xl font-bold">Choose a new password</h1>
      {link === "checking" && <p className="mt-4 text-sm text-muted-foreground">Verifying your reset link…</p>}
      {link === "need-email" && (
        <form onSubmit={verifyWithEmail} className="mt-4 grid gap-3">
          <p className="text-sm text-muted-foreground">Enter the account email to verify this link.</p>
          <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" disabled={busy}>{busy ? "Verifying…" : "Verify link"}</Button>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        </form>
      )}
      {link === "invalid" && (
        <div className="mt-4 grid gap-3">
          <p className="text-sm text-muted-foreground">{msg ?? "This reset link is invalid or expired."}</p>
          <Link href="/forgot-password" className="rounded-xl bg-primary px-4 py-2 text-center text-sm text-white">Request a fresh link</Link>
        </div>
      )}
      {link === "ready" && (
        <form onSubmit={submit} className="mt-4 grid gap-3">
          <div className="relative">
            <Input placeholder="New password (min 8 characters)" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required className="pr-16" />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save new password"}</Button>
        </form>
      )}
      {link === "ready" && msg && <p className="mt-3 text-sm text-muted-foreground">{msg}</p>}
    </div>
  );
}
