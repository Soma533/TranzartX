/** Tiny sanitizer — strips tags/control chars, caps length. Avoids extra dep for MVP. */
export function sanitizeText(input: unknown, max = 2000): string | null {
  if (typeof input !== "string") return null;
  const stripped = input.replace(/<[^>]*>/g, "").replace(/[\u0000-\u001F\u007F]/g, "").trim();
  if (!stripped) return null;
  return stripped.slice(0, max);
}

/**
 * Drop empty-string properties so optional URL/text fields never trip
 * Zod validation (e.g. avatar_url: "" failing .url()). Other values pass through.
 */
export function stripEmptyStrings<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "")) as Partial<T>;
}
