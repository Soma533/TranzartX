import pino from "pino";

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug"
});

/** Standard API error shape */
export function apiError(code: string, message: string, status = 400) {
  return Response.json({ error: { code, message } }, { status });
}
