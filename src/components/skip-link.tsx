/**
 * Skip-to-content link. Visually hidden until focused, then appears in the
 * top-left corner and jumps keyboard users straight to #main-content so
 * they do not have to tab through every nav/interactive element to reach
 * the workspace.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-[#138a72] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#cbe8df]"
    >
      Skip to content
    </a>
  );
}
