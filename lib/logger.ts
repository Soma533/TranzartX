import pino from "pino";

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug"
});

/** Standard API error shape. Logs server-side so Netlify function logs name the fault. */
export function apiError(code: string, message: string, status = 400) {
  if (status >= 500) logger.error({ code, message, status });
  return Response.json({ error: { code, message } }, { status });
}
