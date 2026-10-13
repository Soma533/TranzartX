import Link from "next/link";
import { headers } from "next/headers";
import { Card } from "@/components/ui/card";
import { createServerSupabase } from "@/lib/supabase/server";
import { buildToday } from "@/services/today.service";
import { CompassIcon, FrameIcon, MailIcon, UsersIcon, FlagIcon, GearIcon } from "@/components/icons";

/**
 * Today dashboard — PRD §10. Reads the session directly (no self-fetch), so
 * it always shows live data instead of silently falling back to placeholders.
 */
export default async function TodayPage() {
  let signedIn = false;
  const data = await (async () => {
    try {
      await headers();
      const supabase = await createServerSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      signedIn = Boolean(user);
      if (!user) return null;
      const { data: profile } = await supabase
        .from("profiles").select("id").eq("user_id", user.id).maybeSingle();
      return buildToday(supabase, (profile as { id: string } | null)?.id ?? null);
    } catch {
      return null;
    }
  })();

  if (!signedIn) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold">Today on TranzartX</h1>
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Log in to see your personalised dashboard.</p>
          <Link href="/login" className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Log in
          </Link>
        </Card>
      </div>
    );
  }

  const tiles = [
    {
      key: "goal",
      label: "Your career goal",
      value: data?.goal?.title ?? "Not set yet",
      href: "/goals",
      cta: data?.goal ? "Edit goal" : "Set your goal",
      Icon: FlagIcon
    },
    {
      key: "step",
      label: "Your next step",
      value: data?.nextStep ?? "Complete your artist statement",
      href: "/profile",
      cta: "Open profile",
      Icon: CompassIcon
    },
    {
      key: "opps",
      label: "Opportunities",
      value: `${data?.opportunities.length ?? 0} matched to you`,
      href: "/opportunities",
      cta: "Browse opportunities",
      Icon: CompassIcon
    },
    {
      key: "people",
      label: "People to discover",
      value: data?.people.length ? data.people.map((p) => p.name).join(", ") : "Curators, galleries and artists",
      href: "/network",
      cta: "Open network",
      Icon: UsersIcon
    },
    {
      key: "views",
      label: "Profile activity",
      value: `${data?.activity.profileViews ?? 0} views`,
      href: "/analytics",
      cta: "View analytics",
      Icon: GearIcon
    },
    {
      key: "inquiries",
      label: "Commerce",
      value: `${data?.commerce.inquiries ?? 0} collector inquiries`,
      href: "/inquiries",
      cta: "Open inquiries",
      Icon: MailIcon
    }
  ];

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-bold">Today on TranzartX</h1>
        <p className="text-sm text-muted-foreground">Your next step, matches and activity — all in one place.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {tiles.map((t) => (
          <Card key={t.key} className="flex flex-col justify-between p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <t.Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="mt-0.5 break-words text-sm text-muted-foreground">{t.value}</p>
              </div>
            </div>
            <Link
              href={t.href}
              className="mt-3 inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              {t.cta}
            </Link>
          </Card>
        ))}
      </div>

      {data && data.opportunities.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-semibold">Matched opportunities</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-3">
            {data.opportunities.map((o) => (
              <li key={o.id}>
                <Link href={`/opportunities/${o.id}`} className="block rounded-xl border p-3 text-sm hover:bg-secondary">
                  <span className="line-clamp-2 font-medium">{o.title}</span>
                  {o.deadline && (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Closes {new Date(o.deadline).toLocaleDateString()}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href="/portfolio" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          <FrameIcon className="h-4 w-4" />
          My portfolio
        </Link>
        <Link href="/discover" className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-secondary">
          <CompassIcon className="h-4 w-4" />
          Discover art
        </Link>
        <Link href="/messages" className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-secondary">
          <MailIcon className="h-4 w-4" />
          Messages
        </Link>
      </div>
    </div>
  );
}