"use client";
import { useRef, useState } from "react";

const THRESHOLD = 60; // px of rightward drag that arms a reply
const MAX_DRAG = 88;

/**
 * Swipe-right-to-reply. Works with touch (phones/tablets) and with a mouse
 * drag (PC), so neither device is left without the gesture.
 */
export function useSwipeReply(onReply: () => void) {
  const [drag, setDrag] = useState(0);
  const startX = useRef<number | null>(null);
  const fired = useRef(false);

  function onPointerDown(e: React.PointerEvent) {
    // Ignore secondary buttons; let the browser handle normal text selection.
    if (e.button !== 0) return;
    startX.current = e.clientX;
    fired.current = false;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (dx <= 0) {
      // Swiping left is not a gesture here — snap back.
      if (drag !== 0) setDrag(0);
      return;
    }
    const next = Math.min(dx, MAX_DRAG);
    setDrag(next);
    if (next >= THRESHOLD && !fired.current) {
      fired.current = true;
      onReply();
    }
  }

  function onPointerUp() {
    startX.current = null;
    // Reset after the snap-back animation reads correctly.
    if (drag !== 0) window.setTimeout(() => setDrag(0), 120);
  }

  return {
    drag,
    swiping: drag > 0,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      // Stop the drag from turning into a text selection.
      style: { touchAction: "pan-y" as const, userSelect: "none" as const }
    }
  };
}