"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password")
});
const signupSchema = loginSchema.extend({
  name: z.string().min(2, "Enter your name").max(80),
  password: z.string().min(8, "Password needs at least 8 characters").max(128)
});

function friendly(message: string): string {
  if (/invalid login|invalid.*credentials/i.test(message)) return "Wrong email or password. Try again or reset it below.";
  if (/already registered|already exists/i.test(message)) return "This email already has an account. Log in instead.";
  if (/confirm|not confirmed/i.test(message)) return "Check your inbox for the confirmation email first.";
  return message;
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const schema = mode === "signup" ? signupSchema : loginSchema;
  type FormValues = { email: string; password: string; name?: string };
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema) as never
  });

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/today");
      else setChecking(false);
    });
  }, [router]);

  async function onSubmit(values: z.infer<typeof schema>) {
    setServerMsg(null);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const v = values as z.infer<typeof signupSchema>;
        const { error } = await supabase.auth.signUp({ email: v.email, password: v.password, options: { data: { name: v.name } } });
        if (error) throw error;
        setServerMsg("Account created — check your email to confirm, then complete onboarding.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
        if (error) throw error;
        router.replace("/today");
      }
    } catch (err) {
      setServerMsg(friendly(err instanceof Error ? err.message : "Something went wrong"));
    }
  }

  async function google() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/today` }
    });
  }

  if (checking) return <p className="mx-auto max-w-md py-10 text-center text-sm text-muted-foreground">Checking session…</p>;

  return (
    <div className="mx-auto max-w-md rounded-3xl border bg-white p-8">
      <p className="text-sm uppercase tracking-widest text-primary">TranzartX</p>
      <h1 className="mt-1 text-2xl font-bold">{mode === "signup" ? "Join as an artist" : "Welcome back"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "signup" ? "Build your career, not just your feed." : "Pick up where your career left off."}
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid gap-3" noValidate>
        {mode === "signup" && (
          <div>
            <Input placeholder="Full name" {...register("name")} aria-invalid={Boolean(errors.name)} />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
          </div>
        )}
        <div>
          <Input placeholder="Email" type="email" autoComplete="email" {...register("email")} aria-invalid={Boolean(errors.email)} />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div>
          <Input placeholder="Password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} {...register("password")} aria-invalid={Boolean(errors.password)} />
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}</Button>
      </form>
      <Button variant="outline" className="mt-3 w-full" onClick={google}>Continue with Google</Button>
      {serverMsg && <p className="mt-3 text-sm text-muted-foreground">{serverMsg}</p>}
      <div className="mt-4 flex justify-between text-sm">
        {mode === "signup" ? (
          <Link href="/login" className="text-primary hover:underline">Have an account? Log in</Link>
        ) : (
          <>
            <Link href="/signup" className="text-primary hover:underline">New here? Join</Link>
            <Link href="/forgot-password" className="text-muted-foreground hover:underline">Forgot password?</Link>
          </>
        )}
      </div>
    </div>
  );
}
