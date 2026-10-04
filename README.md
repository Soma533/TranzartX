# TranzartX

An African art commerce and professional networking platform designed primarily for emerging African visual artists.

**What it does**

- **Art marketplace:** artists list and sell original works directly to buyers, with secure payments.
- **Professional networking:** artists create portfolios and connect with galleries, collectors, curators, and other artists.
- **Discovery:** buyers discover emerging talent by style, medium, country, and price.
- **Career growth:** opportunities, commissions, exhibitions, and guidance for emerging artists.

**Who it's for**

- Emerging African visual artists
- Collectors and art lovers
- Galleries, curators, and art organizations

**Tagline:** Don't just showcase your art. Build your career.

---

## For developers

African art commerce and professional networking for emerging artists.
**Don't just showcase your art. Build your career.**

Next.js 15 monolith (App Router) + Supabase (Postgres, Auth, Storage, Realtime) + Paystack checkout.

## Quick start

1. **Install** — `npm install`
2. **Configure** — copy `.env.example` to `.env` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (e.g. `http://127.0.0.1:3000`)
   - Paystack test keys to enable checkout; `RESEND_API_KEY` for email; `AI_PROVIDER` + key for AI features. Everything degrades gracefully when keys are absent — see `/api/env/status`.
3. **Database** — in Supabase SQL editor, run in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_saves.sql`
   - optionally `supabase/seed.sql` (sample opportunities; needs one GALLERY/ORG profile first)
4. **Storage** — create public buckets `artworks` and `avatars`.
5. **Auth** — enable Email + Google provider; add redirect `http://127.0.0.1:3000/auth/callback`.
6. **Realtime** — enable replication for `messages` and `notifications`.
7. **Run** — double-click `start-dev.bat` (Windows) or `npm run dev`. Open http://127.0.0.1:3000.

> Keep the project outside OneDrive-synced folders, or exclude `.next` and `node_modules` from sync — OneDrive corrupts Next.js symlinks (`EINVAL readlink index.meta`) and breaks dev.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build (must pass before deploy)
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — Vitest suite

## Deploy (Vercel)

Push to GitHub, import in Vercel, add the same env vars with `NEXT_PUBLIC_APP_URL` set to the production URL, deploy. Set the Paystack webhook URL to `https://<domain>/api/webhooks/paystack` (Settings → API Keys & Webhooks).
