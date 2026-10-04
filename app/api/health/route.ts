import type { NextRequest } from "next/server";

/** Minimal Vitest config note — real config in vitest.config.ts if needed. */
export function GET(_req: NextRequest) {
  return Response.json({ ok: true, service: "tranzartx" });
}
