"use client";
import { useToast } from "@/hooks/use-toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="fixed bottom-4 right-4 z-50 grid gap-2">
      {toasts.map((t) => (
        <button key={t.id} onClick={() => dismiss(t.id)} className="rounded-xl bg-foreground px-4 py-2 text-sm text-background shadow-lg">
          {t.message}
        </button>
      ))}
    </div>
  );
}
