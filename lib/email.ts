import { Resend } from "resend";
import { logger } from "@/lib/logger";

/**
 * Transactional email (Resend). Best-effort: returns false when unconfigured
 * or sending fails — callers must never fail a request because email failed.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from || !to) return false;
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({ from, to, subject, html });
    if (error) {
      logger.error(`Resend: ${error.message}`);
      return false;
    }
    return true;
  } catch (err) {
    logger.error(err);
    return false;
  }
}

export function inquiryEmailHtml(artistName: string, artworkTitle: string, message: string): string {
  return `<p>Hi ${artistName},</p><p>A collector asked about <strong>${artworkTitle}</strong>:</p><blockquote>${message}</blockquote><p>Reply from your <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/inquiries">TranzartX inbox</a>.</p>`;
}

export function receiptEmailHtml(buyerName: string, artworkTitle: string, amount: string): string {
  return `<p>Hi ${buyerName},</p><p>Your purchase of <strong>${artworkTitle}</strong> (${amount}) is confirmed. The artist will contact you about delivery.</p><p>— TranzartX</p>`;
}
