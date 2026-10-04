/**
 * Paystack integration (hosted checkout, server-side verify).
 * Docs: https://paystack.com/docs/api/transaction/
 * Amounts are in minor units (kobo/pesewas) — identical to our price_cents
 * for NGN/GHS. Never trust client amounts — always verify via API.
 */

const BASE = "https://api.paystack.co";

function authHeaders() {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Missing PAYSTACK_SECRET_KEY");
  return { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" };
}

export interface InitPaymentInput {
  reference: string;
  amountMinor: number;
  currency: string;
  email: string;
  callbackUrl: string;
}

export async function initPaystackPayment(input: InitPaymentInput): Promise<string> {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email: input.email,
      amount: input.amountMinor,
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: { platform: "TranzartX" }
    })
  });
  if (!res.ok) throw new Error(`Paystack init failed: ${res.status}`);
  const json = (await res.json()) as { status?: boolean; message?: string; data?: { authorization_url?: string } };
  const link = json.data?.authorization_url;
  if (!json.status || !link) throw new Error(`Paystack init rejected: ${json.message ?? "unknown"}`);
  return link;
}

export interface PaystackVerifyData {
  status?: string;
  reference?: string;
  amount?: number;
  currency?: string;
}

export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerifyData | null> {
  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error(`Paystack verify failed: ${res.status}`);
  const json = (await res.json()) as { status?: boolean; data?: PaystackVerifyData };
  if (!json.status) return null;
  return json.data ?? null;
}

/** Validate webhook `x-paystack-signature` (HMAC-SHA512 of the raw body, constant-time). */
export async function isValidPaystackSignature(rawBody: string, presented: string | null): Promise<boolean> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !presented) return false;
  const { createHmac, timingSafeEqual } = await import("crypto");
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(presented);
  return a.length === b.length && timingSafeEqual(a, b);
}
