import { createAdminSupabase } from "@/lib/supabase/admin";
import { isValidPaystackSignature, verifyPaystackTransaction } from "@/lib/payments-paystack";
import { sendEmail, receiptEmailHtml } from "@/lib/email";
import { logger } from "@/lib/logger";

/** Paystack webhook — HMAC check + server-side verify (idempotent). */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  if (!(await isValidPaystackSignature(rawBody, signature)))
    return Response.json({ error: "invalid signature" }, { status: 401 });
  const body = (JSON.parse(rawBody) as { event?: string; data?: { reference?: string } });
  if (body.event !== "charge.success" || !body.data?.reference) return Response.json({ ok: true });
  const reference = body.data.reference;
  try {
    // Never trust the event — re-verify with Paystack directly.
    const d = await verifyPaystackTransaction(reference);
    if (!d || d.status !== "success") return Response.json({ ok: true });
    const admin = createAdminSupabase();
    const { data: existing } = await admin
      .from("transactions")
      .select("amount_cents,currency,status,provider")
      .eq("gateway_ref", reference)
      .maybeSingle();
    const tx = existing as { amount_cents: number; currency: string; status: string; provider: string } | null;
    if (!tx) {
      logger.error(`Webhook for unknown reference ${reference}`);
      return Response.json({ ok: true });
    }
    if (d.amount !== tx.amount_cents || d.currency !== tx.currency) {
      logger.error(`Amount mismatch on ${reference}: expected ${tx.amount_cents}${tx.currency}, got ${d.amount}${d.currency}`);
      return Response.json({ ok: true });
    }
    if (tx.status === "SUCCESSFUL") return Response.json({ ok: true }); // idempotent
    await admin.from("transactions").update({
      status: "SUCCESSFUL", verified_at: new Date().toISOString()
    }).eq("gateway_ref", reference);
    const { data: full } = await admin.from("transactions").select("artwork_id,buyer_id").eq("gateway_ref", reference).single();
    const f = full as { artwork_id: string; buyer_id: string } | null;
    if (f) {
      await admin.from("artworks").update({ availability: "SOLD" }).eq("id", f.artwork_id);
      try {
        const { data: artTitle } = await admin.from("artworks").select("title,artist_id").eq("id", f.artwork_id).maybeSingle();
        const at = artTitle as { title: string; artist_id: string } | null;
        if (at) {
          const { data: bProf } = await admin.from("profiles").select("user_id,name").eq("id", f.buyer_id).maybeSingle();
          const buyer = bProf as { user_id: string; name: string } | null;
          if (buyer) {
            const { data: bu } = await admin.auth.admin.getUserById(buyer.user_id);
            const email = bu?.user?.email ?? null;
            if (email) await sendEmail(email, `Receipt: ${at.title}`, receiptEmailHtml(buyer.name, at.title, `${tx.amount_cents / 100} ${tx.currency}`));
          }
          const { data: ap } = await admin.from("profiles").select("user_id").eq("id", at.artist_id).maybeSingle();
          const apUser = ap as { user_id: string } | null;
          if (apUser) {
            await admin.from("notifications").insert({
              user_id: apUser.user_id, type: "sale", title: "Artwork sold!",
              body: `${at.title} just sold. Contact the buyer about delivery.`, link: "/analytics"
            });
          }
        }
      } catch { /* email/notify optional */ }
    }
    return Response.json({ ok: true });
  } catch (err) {
    logger.error(err);
    return Response.json({ ok: false }, { status: 500 });
  }
}
