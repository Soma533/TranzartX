import { Card, CardTitle } from "@/components/ui/card";
import { headers } from "next/headers";

export default async function TodayPage() {
  let data: {
    goal?: { title: string } | null; nextStep?: string | null;
    opportunities?: { id: string }[]; people?: { id: string; name: string }[];
    activity?: { profileViews: number }; commerce?: { inquiries: number };
  } | null = null;
  try {
    const h = await headers();
    const cookie = h.get("cookie") ?? "";
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    if (base) {
      const res = await fetch(`${base}/api/today`, { headers: { cookie }, cache: "no-store" }).catch(() => null);
      data = res ? await res.json().catch(() => null) : null;
    }
  } catch {
    data = null;
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Today on TranzartX</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardTitle>Your career goal</CardTitle><p className="mt-1 text-sm text-muted-foreground">{data?.goal?.title ?? "Set your first goal to get personalized steps."}</p></Card>
        <Card><CardTitle>Your next step</CardTitle><p className="mt-1 text-sm text-muted-foreground">{data?.nextStep ?? "Complete your artist statement."}</p></Card>
        <Card><CardTitle>Opportunities</CardTitle><p className="mt-1 text-sm text-muted-foreground">{data ? `${data.opportunities?.length ?? 0} matches — see Opportunities tab.` : "Sign in to see matches."}</p></Card>
        <Card><CardTitle>People to discover</CardTitle><p className="mt-1 text-sm text-muted-foreground">{data?.people?.length ? data.people.map((p) => p.name).join(", ") : "Curators, galleries and artists in your medium."}</p></Card>
        <Card><CardTitle>Profile activity</CardTitle><p className="mt-1 text-sm text-muted-foreground">{data ? `${data.activity?.profileViews ?? 0} views` : "—"}</p></Card>
        <Card><CardTitle>Commerce</CardTitle><p className="mt-1 text-sm text-muted-foreground">{data ? `${data.commerce?.inquiries ?? 0} collector inquiries` : "—"}</p></Card>
      </div>
    </div>
  );
}
