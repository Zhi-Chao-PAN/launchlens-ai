/**
 * The "set state, then auto-clear if still the same value" pattern used
 * by copy / download / save buttons to flash a "Copied!" checkmark
 * for a moment before returning to the idle label.
 *
 * The two helpers here cover the pure parts of the contract:
 *
 * - `FLASH_STATE_DURATION_MS` is the canonical delay; if any caller
 *   wants a different duration (e.g. a 2.2s download feedback) it
 *   can opt in explicitly.
 * - `clearIfStill<T>(current, target, sentinel)` is the reducer that
 *   the setTimeout callback uses to clear the state only if it has
 *   not been overwritten by a newer flash in the meantime. The
 *   sentinel is the "empty" value to assign (defaults to the empty
 *   string, which is what the copy-button state machine uses).
 */
export const FLASH_STATE_DURATION_MS = 1800;

/**
 * Reducer: if the live state value still equals `target`, replace it
 * with `sentinel`; otherwise leave it alone (a newer flash has taken
 * over).
 *
 * Used inside the `setTimeout` callback of a flash-style state
 * machine so the older flash doesn't wipe out a newer one if the
 * user copies / downloads in quick succession.
 *
 * The sentinel defaults to the empty string — pass an explicit
 * sentinel when the state machine uses a different "empty" value
 * (e.g. a number-typed flash).
 */
export function clearIfStill<T>(
  current: T,
  target: T,
  sentinel: T = "" as T,
): T {
  return current === target ? sentinel : current;
}