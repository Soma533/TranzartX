"use client";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches
    || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Visible install affordance. Chrome/Android/Edge fire `beforeinstallprompt`,
 * which we capture so we can offer a real one-tap install. iOS Safari has no
 * such event, so those users get the Share -> Add to Home Screen instructions.
 */
export function InstallButton({ compact = false }: { compact?: boolean }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());

    const onPrompt = (e: Event) => {
      // Suppress Chrome's mini-infobar so we control the messaging.
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Safari can install silently if already added — re-check shortly after load.
    const t = setTimeout(() => setInstalled(isStandalone()), 1200);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      clearTimeout(t);
    };
  }, []);

  if (installed) return null;

  async function install() {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setDeferred(null);
      return;
    }
    setShowIOSHelp(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void install()}
        title="Install TranzartX on this device"
        aria-label="Install TranzartX on this device"
        className={`inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 ${compact ? "h-10 w-10 shrink-0 px-0 sm:w-auto sm:px-3" : "px-4 py-2 text-sm"} font-medium`}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3.5v11M8 11l4 4 4-4M4.5 17.5v1.2a1.8 1.8 0 0 0 1.8 1.8h11.4a1.8 1.8 0 0 0 1.8-1.8v-1.2" />
        </svg>
        {/* Icon-only on phones so it fits beside the Menu button. */}
        <span className={compact ? "hidden sm:inline" : ""}>Install app</span>
      </button>

      {showIOSHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="How to install TranzartX"
          onClick={() => setShowIOSHelp(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-semibold">Install TranzartX</p>
            <ol className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <li>1. Tap the <strong>Share</strong> button (square with an arrow) in your browser.</li>
              <li>2. Scroll and tap <strong>Add to Home Screen</strong>.</li>
              <li>3. Tap <strong>Add</strong> — TranzartX opens like an app.</li>
            </ol>
            {!isIOS() && (
              <p className="mt-3 text-sm text-muted-foreground">
                On desktop Chrome/Edge, click the install icon in the address bar.
              </p>
            )}
            <button
              type="button"
              onClick={() => setShowIOSHelp(false)}
              className="mt-4 w-full rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}