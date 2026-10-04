"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

interface Inquiry { id: string; artwork_id: string; from_id: string; to_artist_id: string; message: string; status: string; created_at: string; }

/** Purchase-inquiry inbox for artists and sent box for collectors (PRD §14). */
export default function InquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  useEffect(() => {
    fetch("/api/inquiries").then((r) => r.json()).then((j) => setItems(j.inquiries ?? [])).catch(() => null);
  }, []);
  return (
    <div className="grid gap-3">
      <h1 className="text-2xl font-bold">Inquiries</h1>
      {items.map((q) => (
        <Card key={q.id}>
          <p className="text-sm">{q.message}</p>
          <p className="mt-1 text-xs text-muted-foreground">{q.status} · {new Date(q.created_at).toLocaleDateString()}</p>
          <Link href={`/messages?to=${q.from_id}`} className="mt-2 inline-block text-sm text-primary hover:underline">Reply in messages</Link>
        </Card>
      ))}
      {items.length === 0 && <p className="text-sm text-muted-foreground">No inquiries yet — inquiries from collectors appear here.</p>}
    </div>
  );
}
