// Utilities for coordinating overlay layers so that Escape closes the
// topmost overlay and does not cascade into toasts/other overlays.
let overlayCount = 0;

export function pushOverlay() {
  overlayCount++;
  return () => {
    overlayCount = Math.max(0, overlayCount - 1);
  };
}

export function hasOpenOverlay() {
  return overlayCount > 0;
}


/** Test-only helper: reset the overlay counter. Exposed primarily for vitest. */
export function __resetOverlayStackForTests() {
  overlayCount = 0;
}
