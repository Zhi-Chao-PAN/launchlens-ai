"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Screen-reader announcement hook.
 *
 * Returns a stable `announce` function and a `message` string that should be
 * rendered inside an aria-live region. The message is intentionally cleared
 * after a short delay so announcing the same text twice still triggers a
 * screen-reader utterance (live regions only fire when the content changes).
 */
export function useSrAnnounce() {
  const [message, setMessage] = useState("");
  const clearTimerRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  const announce = useCallback((text: string) => {
    if (clearTimerRef.current !== null) {
      window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    // Clear first so re-announcing the same message still triggers
    setMessage("");
    // Defer to the next frame so the live region registers a change
    frameRef.current = window.requestAnimationFrame(() => {
      setMessage(text);
      frameRef.current = null;
      // Clear after a delay so subsequent identical announces work
      clearTimerRef.current = window.setTimeout(() => {
        setMessage("");
        clearTimerRef.current = null;
      }, 1500);
    });
  }, []);

  return { announce, message };
}
