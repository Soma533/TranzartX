"use client";
import { useEffect, useState } from "react";
import { confirmInstalled, useAppInstalled, type BeforeInstallPromptEvent } from "@/hooks/use-app-installed";

/**
 * `beforeinstallprompt` fires once, early, and can be missed if we only listen
 * inside a React effect. Capture it at module scope and fan it out to any
 * component that mounts later.
 */
let deferred: BeforeInstallPromptEvent | null = null;
const subscribers: Set<() => void> = new Set();
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
}
if (typeof window !== "undefined") attachListener();

/**
 * Waits briefly for a pending install event and returns it, if one turns up.
 * Chrome only raises it once the page is installable, so letting the service
 * worker settle first usually converts a dead click into a real install.
 */
async function waitForPrompt(timeoutMs = 3000): Promise<BeforeInstallPromptEvent | null> {
  if (deferred) return deferred;
  try {
    await navigator.serviceWorker?.ready;
  } catch { /* not registered — carry on and wait anyway */ }
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      resolve(deferred);
    }, timeoutMs);
    function onPrompt(e: Event) {
      e.preventDefault();
      deferred = e as BeforeInstallPromptEvent;
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      resolve(deferred);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
  });
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Install affordance. Hidden once TranzartX is installed on the device, since
 * there is nothing left to install. Tapping opens the browser's own install
 * dialog immediately — the app installs straight away, with no extra screen in
 * between. The instruction card is a last resort for iOS, where no browser
 * exposes the install event at all.
 */
export function InstallButton({ compact = false }: { compact?: boolean }) {
  const [, force] = useState(0);
  const [busy, setBusy] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const installed = useAppInstalled();

  useEffect(() => {
    const rerender = () => force((n) => n + 1);
    subscribers.add(rerender);
    return () => { subscribers.delete(rerender); };
  }, []);

  async function install() {
    setBusy(true);
    try {
      const prompt = await waitForPrompt();
      if (prompt) {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        deferred = null;
        // Accepted means the app is now on the device — hide the button. The
        // `appinstalled` event covers the rest, but it does not fire everywhere.
        if (choice.outcome === "accepted") confirmInstalled();
        notify();
        return;
      }
      // No install event available — iOS and a few embedded browsers.
      setShowIOSHelp(true);
    } catch {
      setShowIOSHelp(true);
    } finally {
      setBusy(false);
    }
  }

  // Nothing to offer once the app is installed.
  if (installed) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => void install()}
        disabled={busy}
        title="Install TranzartX on this device"
        aria-label="Install TranzartX on this device"
        className={`inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/5 font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-60 ${compact ? "h-10 w-10 shrink-0 px-0 sm:w-auto sm:px-3" : "px-4 py-2 text-sm"}`}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3.5v11M8 11l4 4 4-4M4.5 17.5v1.2a1.8 1.8 0 0 0 1.8 1.8h11.4a1.8 1.8 0 0 0 1.8-1.8v-1.2" />
        </svg>
        <span className={compact ? "hidden sm:inline" : ""}>{busy ? "Installing…" : "Install app"}</span>
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
            {isIOS() ? (
              <ol className="mt-3 grid gap-2 text-sm text-muted-foreground">
                <li>1. Tap the <strong>Share</strong> button (square with an arrow) in your browser.</li>
                <li>2. Scroll and tap <strong>Add to Home Screen</strong>.</li>
                <li>3. Tap <strong>Add</strong> — TranzartX opens like an app.</li>
              </ol>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                This browser has already installed TranzartX, or it does not allow
                installs from the page. Use the install icon in the address bar
                (Chrome/Edge) or ⋮ → Cast, save and share → Install page as app.
              </p>
            )}
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