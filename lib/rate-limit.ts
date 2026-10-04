/**
 * Minimal in-memory rate limiter for Route Handlers.
 * For multi-instance production, swap with Upstash Redis.
 */
const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

export function rateLimitKey(request: Request, scope: string): string {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  return `${scope}:${ip}`;
}
