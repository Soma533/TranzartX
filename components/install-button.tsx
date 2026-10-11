"use client";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const INSTALLED_KEY = "tranzartx-installed";

/**
 * `beforeinstallprompt` fires once, early, and can be missed if we only listen
 * inside a React effect. Capture it at module scope and fan it out to any
 * component that mounts later.
 */
let deferred: BeforeInstallPromptEvent | null = null;
const subscribers = new Set<() => void>();
let attached = false;

function notify() {
  subscribers.forEach((fn) => fn());
}

function attachListener() {
  if (attached || typeof window === "undefined") return;
  attached = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    // Suppress Chrome's mini-infobar so our button is the single entry point.
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    try { localStorage.setItem(INSTALLED_KEY, "1"); } catch { /* private mode */ }
    notify();
  });
}
if (typeof window !== "undefined") attachListener();

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

function alreadyInstalled() {
  try { return localStorage.getItem(INSTALLED_KEY) === "1"; } catch { return false; }
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Install affordance.
 *
 * The button only appears when tapping it can actually install the app:
 *  - the browser raised `beforeinstallprompt` → tapping opens the native
 *    install dialog immediately, with no intermediate screen
 *  - iOS, where no browser exposes that event and Add to Home Screen is the
 *    only route → tapping shows the short instruction card
 * Everywhere else the button stays hidden rather than offering dead-end text,
 * because a site cannot install itself without the browser's permission.
 */
export function InstallButton({ compact = false }: { compact?: boolean }) {
  const [, force] = useState(0);
  const [installed, setInstalled] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone() || alreadyInstalled());
    const rerender = () => force((n) => n + 1);
    subscribers.add(rerender);
    return () => { subscribers.delete(rerender); };
  }, []);

  if (installed) return null;

  const canPrompt = Boolean(deferred);
  const iosOnly = !canPrompt && isIOS();

  if (!canPrompt && !iosOnly) return null;

  async function install() {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        try { localStorage.setItem(INSTALLED_KEY, "1"); } catch { /* ignore */ }
      }
      deferred = null;
      force((n) => n + 1);
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
        className={`inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/5 font-medium text-primary transition-colors hover:bg-primary/10 ${compact ? "h-10 w-10 shrink-0 px-0 sm:w-auto sm:px-3" : "px-4 py-2 text-sm"}`}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3.5v11M8 11l4 4 4-4M4.5 17.5v1.2a1.8 1.8 0 0 0 1.8 1.8h11.4a1.8 1.8 0 0 0 1.8-1.8v-1.2" />
        </svg>
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
          <div className="w-full max-w-sm rounded-2xl bg-background p-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-semibold">Install TranzartX</p>
            <ol className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <li>1. Tap the <strong>Share</strong> button (square with an arrow) in your browser.</li>
              <li>2. Scroll and tap <strong>Add to Home Screen</strong>.</li>
              <li>3. Tap <strong>Add</strong> — TranzartX opens like an app.</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSHelp(false)}
              className="mt-4 w-full rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}