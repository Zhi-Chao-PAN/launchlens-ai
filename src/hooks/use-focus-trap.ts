"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight focus trap for modals/dialogs. When `active` is true, Tab and
 * Shift+Tab cycle only through focusable descendants of `ref`. Focus is moved
 * into the container on activation (to the element with [autofocus] or the
 * first focusable descendant) and restored to the previously-focused element
 * on deactivation.
 *
 * This intentionally avoids pulling in a heavier dialog primitive — LaunchLens
 * modals are simple enough that a FOCUSABLE_SELECTOR walk is sufficient, and
 * we want to stay off jsdom in unit tests.
 */

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  'button:not([disabled]):not([aria-hidden="true"])',
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "object",
  "embed",
  '[tabindex]:not([tabindex="-1"])',
  "[contenteditable=true]",
].join(",");

export function useFocusTrap<T extends HTMLElement>(
  active: boolean,
  options: { restoreFocus?: boolean } = { restoreFocus: true },
) {
  const ref = useRef<T | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!active || !root) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (el) =>
          !el.hasAttribute("disabled") &&
          el.getAttribute("aria-hidden") !== "true" &&
          el.tabIndex !== -1 &&
          !el.closest("[inert]"),
      );

    // Move focus inside; prefer [autofocus], else first focusable.
    const autoFocusEl = root.querySelector<HTMLElement>("[autofocus]");
    const focusables = getFocusable();
    const initial =
      (autoFocusEl && focusables.includes(autoFocusEl)
        ? autoFocusEl
        : focusables[0]) || root;
    window.requestAnimationFrame(() => {
      if (typeof initial.focus === "function") {
        initial.focus({ preventScroll: true });
      }
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const list = getFocusable();
      if (list.length === 0) {
        event.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;
      if (event.shiftKey) {
        if (!activeEl || activeEl === first || !root.contains(activeEl)) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (!activeEl || activeEl === last || !root.contains(activeEl)) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    root.addEventListener("keydown", onKeyDown);
    return () => {
      root.removeEventListener("keydown", onKeyDown);
      if (options.restoreFocus === false) {
        previouslyFocusedRef.current = null;
        return;
      }
      const prev = previouslyFocusedRef.current;
      if (
        prev &&
        typeof prev.focus === "function" &&
        document.contains(prev)
      ) {
        window.requestAnimationFrame(() => prev.focus({ preventScroll: true }));
      }
      previouslyFocusedRef.current = null;
    };
  }, [active, options.restoreFocus]);

  return ref;
}
