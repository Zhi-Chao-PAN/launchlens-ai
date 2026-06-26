export type Theme = "light" | "dark" | "system";

/**
 * The theme cycle applied when the user clicks the ThemeToggle.
 *
 * Centralised so the order cannot drift between the useTheme hook
 * (which actually advances the state) and any future shortcut / menu
 * surface that wants to advance the theme without going through the
 * hook.
 */
export const THEME_CYCLE: readonly Theme[] = ["light", "dark", "system"] as const;

/**
 * Return the next theme in the cycle.
 *
 * - `light` -> `dark`
 * - `dark`  -> `system`
 * - `system`-> `light`
 *
 * Unknown themes fall back to "light" so the UI never gets stuck in an
 * unrecognised state (e.g. if localStorage was edited externally).
 */
export function nextTheme(current: Theme | string): Theme {
  const idx = THEME_CYCLE.indexOf(current as Theme);
  if (idx === -1) return "light";
  return THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
}
