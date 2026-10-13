"use client";

import { useEffect, useState } from "react";

const FLAG = "tranzartx:installed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Tracks whether TranzartX is already installed on this device, so the install
 * affordance can disappear once it is no longer needed.
 *
 * Four independent signals, because no single one covers every platform:
 *  - `display-mode: standalone` / `navigator.standalone` — running from the
 *    home screen / app launcher (Android APK, TWA, installed PWA, iOS).
 *  - `getInstalledRelatedApps()` — Chrome's list of installed related apps.
 *  - the `appinstalled` event — fired by Chrome at the moment of install.
 *  - a localStorage flag — survives reloads, and covers browsers that report
 *    no event at all (iOS Safari has no install event to observe).
 */
type InstallerRelatedApplication = { platform?: string; url?: string; id?: string };

function readFlag(): boolean {
  try {
    return window.localStorage.getItem(FLAG) === "1";
  } catch {
    return false;
  }
}

function markInstalled() {
  try {
    window.localStorage.setItem(FLAG, "1");
  } catch {
    /* private mode — detection still works within this session */
  }
}

/** True when the page is running as an installed app rather than a website. */
function runningStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  if (iosStandalone) return true;
  return window.matchMedia("(display-mode: standalone)").matches
    || window.matchMedia("(display-mode: fullscreen)").matches
    || window.matchMedia("(display-mode: minimal-ui)").matches
    // Chromium's TWA wrapper reports the app id rather than a display mode.
    || /\b(wsa|wv)\b/.test(navigator.userAgent);
}

async function listedInRelatedApps(): Promise<boolean> {
  const nav = navigator as Navigator & {
    getInstalledRelatedApps?: () => Promise<InstallerRelatedApplication[]>;
  };
  if (typeof nav.getInstalledRelatedApps !== "function") return false;
  try {
    const apps = await nav.getInstalledRelatedApps();
    return Array.isArray(apps) && apps.length > 0;
  } catch {
    return false;
  }
}

export function useAppInstalled(): boolean {
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const apply = (value: boolean) => {
      if (!cancelled && value) setInstalled(true);
    };

    if (readFlag() || runningStandalone()) {
      apply(true);
      return () => { cancelled = true; };
    }

    // The install event is the only reliable signal for browsers that stay in
    // browser UI after installing, so it is checked on every load too.
    const onInstalled = () => {
      markInstalled();
      apply(true);
    };
    window.addEventListener("appinstalled", onInstalled);

    void listedInRelatedApps().then(apply);

    // Some browsers report the standalone switch a tick after hydration.
    const mq = window.matchMedia("(display-mode: standalone)");
    const onChange = () => apply(runningStandalone());
    mq.addEventListener?.("change", onChange);

    return () => {
      cancelled = true;
      window.removeEventListener("appinstalled", onInstalled);
      mq.removeEventListener?.("change", onChange);
    };
  }, []);

  return installed;
}

/** Called after the browser's own install dialog reports success. */
export function confirmInstalled() {
  markInstalled();
}

const HIDDEN = "tranzartx:install-hidden";

/**
 * Hides the install affordance permanently for this device. Used when the user
 * dismisses it without installing — browsers report nothing that would let the
 * button re-hide itself later while they browse in a normal tab.
 */
export function dismissInstallPrompt() {
  try {
    window.localStorage.setItem(HIDDEN, "1");
  } catch {
    /* private mode — the choice simply does not persist */
  }
}

export function installPromptDismissed(): boolean {
  try {
    return window.localStorage.getItem(HIDDEN) === "1";
  } catch {
    return false;
  }
}

export type { BeforeInstallPromptEvent };