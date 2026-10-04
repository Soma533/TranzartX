import { requireUser } from "@/services/auth-guard";
import { initPaystackPayment } from "@/lib/payments-paystack";
import { apiError, logger } from "@/lib/logger";

export async function POST(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, user, profileId } = guard;
  const body = (await request.json().catch(() => null)) as { artworkId?: string } | null;
  if (!body?.artworkId) return apiError("VALIDATION", "artworkId required", 422);
  if (!user.email) return apiError("NO_EMAIL", "Add an email to your account first", 400);
  const { data: artwork, error } = await supabase.from("artworks").select("*").eq("id", body.artworkId).single();
  if (error || !artwork) return apiError("NOT_FOUND", "Artwork not found", 404);
  const art = artwork as { price_cents: number | null; currency: string; title: string; artist_id: string; id: string };
  if (!art.price_cents) return apiError("NO_PRICE", "Artwork has no price", 400);
  if (art.artist_id === profileId) return apiError("OWN_ARTWORK", "You cannot buy your own artwork", 400);
  const reference = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    await supabase.from("transactions").insert({
      artwork_id: art.id, buyer_id: profileId, artist_id: art.artist_id,
      flutterwave_tx_ref: reference, gateway_ref: reference, provider: "PAYSTACK",
      amount_cents: art.price_cents, currency: art.currency, status: "PENDING"
    });
    const link = await initPaystackPayment({
      reference,
      amountMinor: art.price_cents,
      currency: art.currency,
      email: user.email,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payments/verify?reference=${reference}`
    });
    return Response.json({ link, reference });
  } catch (err) {
    logger.error(err);
    return apiError("PAYMENT", err instanceof Error ? err.message : "init failed", 500);
  }
}
