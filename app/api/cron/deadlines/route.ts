import { createAdminSupabase } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

const ACTIVE = ["SAVED", "CONSIDERING", "PREPARING", "APPLIED", "CONTACTED"];

/**
 * Deadline reminders (PRD §24). Call weekly via Vercel Cron or manually:
 *   GET /api/cron/deadlines  Authorization: Bearer <CRON_SECRET>
 * Notifies artists tracking opportunities closing within 7 days, honoring
 * notify_deadlines prefs. Idempotent: skips if reminded in the last 6 days.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`)
    return Response.json({ error: "unauthorized" }, { status: 401 });

  try {
    const admin = createAdminSupabase();
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * 86_400_000);
    const { data: opps } = await admin
      .from("opportunities")
      .select("id,title,deadline")
      .gte("deadline", now.toISOString())
      .lte("deadline", soon.toISOString())
      .limit(200);
    let sent = 0;
    for (const o of ((opps as { id: string; title: string; deadline: string }[] | null) ?? [])) {
      const { data: tracks } = await admin
        .from("opportunity_tracking")
        .select("artist_id")
        .eq("opportunity_id", o.id)
        .in("status", ACTIVE)
        .limit(200);
      for (const t of ((tracks as { artist_id: string }[] | null) ?? [])) {
        const { data: prof } = await admin
          .from("profiles")
          .select("user_id,notify_deadlines")
          .eq("id", t.artist_id)
          .maybeSingle();
        const p = prof as { user_id: string; notify_deadlines: boolean } | null;
        if (!p || p.notify_deadlines === false) continue;
        const link = `/opportunities/${o.id}`;
        const since = new Date(now.getTime() - 6 * 86_400_000).toISOString();
        const { count } = await admin
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", p.user_id)
          .eq("link", link)
          .gte("created_at", since);
        if ((count ?? 0) > 0) continue;
        const days = Math.max(0, Math.ceil((new Date(o.deadline).getTime() - now.getTime()) / 86_400_000));
        await admin.from("notifications").insert({
          user_id: p.user_id,
          type: "deadline",
          title: `Deadline in ${days} day${days === 1 ? "" : "s"}: ${o.title}`,
          body: "You are tracking this opportunity. Finish your application.",
          link
        });
        sent += 1;
      }
    }
    return Response.json({ ok: true, sent });
  } catch (err) {
    logger.error(err);
    return Response.json({ ok: false }, { status: 500 });
  }
}
