import { NextResponse } from "next/server";

/**
 * Digital Asset Links — proves to Android that the APK built for
 * com.tranzartx.app may control tranzartx.vercel.app.
 *
 * Without this file the installed app shows a browser URL bar instead of
 * running as a proper standalone app (Trusted Web Activity).
 *
 * Values come from env so they can be set after the APK is signed:
 *   ANDROID_PACKAGE_NAME — applicationId, e.g. com.tranzartx.app
 *   ANDROID_CERT_SHA256  — the signing certificate fingerprint (see README)
 */
export function GET() {
  const pkg = process.env.ANDROID_PACKAGE_NAME;
  const sha = process.env.ANDROID_CERT_SHA256;
  if (!pkg || !sha) {
    // Not configured yet: return an empty valid list rather than a 500.
    return NextResponse.json([], {
      headers: { "Cache-Control": "public, max-age=3600" }
    });
  }
  return NextResponse.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: pkg,
          sha256_cert_fingerprints: [sha]
        }
      }
    ],
    { headers: { "Content-Control": "application/json", "Cache-Control": "public, max-age=3600" } }
  );
}