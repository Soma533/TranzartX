import { describe, expect, it } from "vitest";
import { sanitizeText, stripEmptyStrings } from "./lib/sanitize";
import { rateLimit } from "./lib/rate-limit";
import { isValidPaystackSignature } from "./lib/payments-paystack";
import { profileSchema } from "./schemas";

describe("hardening", () => {
  it("strips html", () => {
    expect(sanitizeText("<b>hi</b>", 10)).toBe("hi");
  });
  it("rate limits", () => {
    const k = `test-${Date.now()}`;
    expect(rateLimit(k, 1)).toBe(true);
    expect(rateLimit(k, 1)).toBe(false);
  });
  it("verifies paystack webhook signatures", async () => {
    process.env.PAYSTACK_SECRET_KEY = "test-secret";
    const { createHmac } = await import("crypto");
    const body = '{"event":"charge.success"}';
    const good = createHmac("sha512", "test-secret").update(body).digest("hex");
    expect(await isValidPaystackSignature(body, good)).toBe(true);
    expect(await isValidPaystackSignature(body, "tampered")).toBe(false);
    expect(await isValidPaystackSignature(body, null)).toBe(false);
  });
  it("strips empty strings so optional fields validate", () => {
    const raw = { name: "Amaka", avatar_url: "", bio: "", commission_open: false, disciplines: [] };
    // Raw form state used to fail validation ("" is not a valid URL)...
    expect(profileSchema.partial().safeParse(raw).success).toBe(false);
    // ...but the cleaned payload the API actually validates passes.
    expect(profileSchema.partial().safeParse(stripEmptyStrings(raw)).success).toBe(true);
  });
});
