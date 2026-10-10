# Turning TranzartX into an Android app (APK)

TranzartX is already an installable PWA, so the Android app is a **Trusted Web
Activity (TWA)** — a real APK that runs your live website full-screen, using the
code already deployed. There is no separate Android codebase to maintain.

The APK is generated on **PWABuilder**, then one verification URL is wired up so
Android trusts the connection and removes the browser address bar.

---

## Step 1 — Confirm the PWA is installable

Your PWA must already be live. Check these, each should return `200`:

| URL | Expected |
|---|---|
| `https://tranzartx.vercel.app/manifest.webmanifest` | JSON manifest |
| `https://tranzartx.vercel.app/icons/icon-192.png` | your icon |
| `https://tranzartx.vercel.app/sw.js` | service worker |

## Step 2 — Generate the APK

1. Go to **https://www.pwabuilder.com**
2. Enter `https://tranzartx.vercel.app` → **Start** → **Check my site**
   - It should report your manifest, service worker and icons as valid
3. Click **Package for stores** → choose **Android** → **Create** → **Download**

You get an `.apk` (sideloadable) and `.aab` (Play Store) bundle.

## Step 3 — Install it

1. Copy the `.apk` to your Android phone (cable, Drive, email to yourself)
2. Open it on the phone
3. Android will warn "unknown source" → allow **Install unknown apps** for that
   app when prompted
4. TranzartX appears on your home screen and opens full-screen

> `sideload` means installing directly on your own device. Never distribute this
> APK publicly — publishing should go through Google Play.

## Step 4 — Remove the browser address bar (important)

By default the TWA shows a browser URL bar because Android cannot yet verify
your domain. Fix it with Digital Asset Links:

1. Find your APK's signing fingerprint. If PWABuilder generated it, the
   fingerprint is shown in the package details. Format: uppercase hex in
   colon-separated pairs, e.g. `A1:B2:C3:…:FF`.
2. Add these to your **Vercel** environment variables (and redeploy):
   ```
   ANDROID_PACKAGE_NAME=com.tranzartx.app
   ANDROID_CERT_SHA256=A1:B2:C3:...:FF
   ```
   Use the package name PWABuilder assigned if it differs.
3. Redeploy, then confirm this returns your fingerprint:
   ```
   https://tranzartx.vercel.app/.well-known/assetlinks.json
   ```
4. Reinstall the APK. The address bar is gone.

Android caches this check for hours — if it still shows the bar, uninstall,
restart the phone, and reinstall.

---

## Why Digital Asset Links

| Without `assetlinks.json` | With it |
|---|---|
| Address bar visible, app feels like a browser | Full-screen, standalone |
| "Open in browser" prompts | Trust established |

The route lives at `app/api/assetlinks/route.ts` and is served at
`/.well-known/assetlinks.json` via the `rewrites` rule in `next.config.mjs`
(Next treats folders beginning with `.` as private and would skip them).

Until you set the two env vars it returns an empty list, which is valid and
harmless — the site is unaffected either way.

---

## Updating the app later

The APK is a shell around your website. When you push new code and Vercel
redeploys, **the installed app already shows the new version** — no rebuild
needed. You only rebuild the APK if you change the icon, name, colours, or
package name.