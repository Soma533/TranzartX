import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Refresh Supabase auth cookies on every request. Skips silently when env is not configured yet. */
export async function middleware(request: NextRequest) {
  // Email links fall back to the Site URL root when a custom redirect path is
  // not allowlisted. Route any auth token landing on / to the reset page.
  const params = request.nextUrl.searchParams;
  if (
    request.nextUrl.pathname === "/" &&
    (params.get("code") ?? params.get("token") ?? params.get("token_hash"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/reset";
    return NextResponse.rewrite(url);
  }
  // NOTE: no hostname canonicalization here — something on this machine
  // rewrites the Host header (127.0.0.1 arrives as localhost), so any
  // host-based redirect loops. Single-host discipline instead: always use
  // http://127.0.0.1:3000 (what start-dev.bat opens).
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options as never));
        }
      }
    }
  );
  await supabase.auth.getUser();
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
