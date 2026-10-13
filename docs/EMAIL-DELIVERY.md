# Making the signup confirmation email actually deliver

**Current state (verified Oct 2026):** Supabase is using its **built-in shared
mailer**. That service has two hard limits:

- roughly **2 emails per hour**, project-wide
- it is designed for project **team members** — mail to ordinary external
  addresses is not a dependable route

The `RESEND_API_KEY` in `.env` is valid, but Resend has **no domain configured**,
so `TranzartX <hello@tranzartx.com>` cannot send yet. That is the reason custom
SMTP was switched off previously.

**Result today:** new signups outside your own accounts are unlikely to receive
the confirmation email at all.

---

## Step 1 — Add and verify your domain in Resend

1. Resend → **Domains** → **Add Domain**
2. Enter your domain (the one behind `hello@tranzartx.com`)
3. Resend shows a set of DNS records (typically two `CNAME` and one `MX`)
4. Add them at your domain registrar, using the values Resend gives you
5. Wait until the domain status turns **Verified**

> Without a verified domain, Resend rejects every send and Supabase SMTP will
> fail the same way. This is the step that was missing before.

## Step 2 — Connect Resend to Supabase

1. Resend → **API Keys** → **Create API Key** → copy it
2. Supabase → **Authentication** → **Email** → **Enable Custom SMTP**

| Field | Value |
|---|---|
| SMTP server | `smtp.resend.com` |
| SMTP port | `465` |
| Username | `resend` |
| Password | the API key you just created |

3. **Save**

## Step 3 — Set the Site URL

Supabase → **Authentication** → **URL Configuration**

- **Site URL**: `https://tranzartx.vercel.app`
- **Redirect URLs**: include `https://tranzartx.vercel.app/auth/callback`
  and `https://tranzartx.vercel.app/auth/reset`

This is what makes the **Log in** button in the email resolve correctly.

## Step 4 — Paste the email template

1. Supabase → **Authentication** → **Email Templates** → **Confirm signup**
2. Subject: `Welcome to TranzartX`
3. Body → **Source** → paste everything from
   `docs/email-templates/confirm-signup.html`
4. **Save**

The template contains your copy — *"Your account has been created
successfully. Welcome to TranzartX"* — plus a **Log in to TranzartX** button
pointing at `{{ .SiteURL }}/login`.

## Step 5 — Verify it really sends

1. Sign up with an address that is **not** one of your Supabase team emails
2. Confirm the inbox (and spam) for the branded email
3. Click **Log in to TranzartX** → you land on `/login`
4. Log in → you are taken straight to profile setup

---

## If you do not own a domain yet

You can still test with Resend's sandbox sender:

- **SMTP password**: your API key, **From**: `onboarding@resend.dev`

That address only delivers **to your own inbox**, which is enough to prove the
template and button are correct before you buy a domain.

## Why not send the email from the app instead?

We could generate the confirmation link with the admin API and send it through
Resend ourselves. That is deliberately not done here: it would duplicate
Supabase's email responsibility, make resend-from-the-app a second path to
maintain, and still would not remove the need for a verified Resend domain.

Configuring SMTP once fixes auth mail, signup confirmation, password reset and
every future template in a single place.