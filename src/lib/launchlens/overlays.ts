/**
 * Utilities for coordinating overlay layers so that Escape closes the
 * topmost overlay and does not cascade into toasts/other overlays.
 *
 * Each call to pushOverlay() returns an independent dispose function.
 * Calling a dispose function more than once is a no-op (idempotent), so
 * double-cleanup in a React StrictMode effect unmount/mount cycle cannot
 * underflow the counter.
 */
let overlayCount = 0;

export function pushOverlay(): () => void {
  overlayCount += 1;
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    overlayCount = Math.max(0, overlayCount - 1);
  };
}

export function hasOpenOverlay(): boolean {
  return overlayCount > 0;
}

/** Test-only helper: reset the overlay counter. Exposed primarily for vitest. */
export function __resetOverlayStackForTests(): void {
  overlayCount = 0;
}
