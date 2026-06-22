/**
 * Pure utilities for Shift+Click range selection.
 *
 * The validation board has two multi-select surfaces:
 *   - Hypotheses/experiments (a single flat list, possibly filtered/sorted)
 *   - Evidence items within an experiment (flat list, possibly filtered)
 *
 * Shift+Click should extend the selection between the last-clicked anchor and
 * the clicked item, respecting the visible order (filtering/sort). The anchor
 * is updated on plain clicks; it is NOT moved on Shift+clicks so that the user
 * can keep extending the range.
 */

/**
 * Compute the ids to add for a range between anchor and target, using visible
 * ordering. Returns a new Set (union of previous + range). Additive-only so
 * that Shift+Click never deselects — consistent with Gmail/Figma conventions.
 */
export function rangeSelectAdd<T>(
  current: ReadonlySet<T>,
  visibleOrder: readonly T[],
  anchor: T | null,
  target: T,
): Set<T> {
  const next = new Set(current);
  if (anchor === null) {
    next.add(target);
    return next;
  }
  const anchorIdx = visibleOrder.indexOf(anchor);
  const targetIdx = visibleOrder.indexOf(target);
  if (anchorIdx === -1 || targetIdx === -1) {
    next.add(target);
    return next;
  }
  const start = Math.min(anchorIdx, targetIdx);
  const end = Math.max(anchorIdx, targetIdx);
  for (let i = start; i <= end; i++) {
    next.add(visibleOrder[i]);
  }
  return next;
}

/**
 * Like rangeSelectAdd but for toggling behaviour: if the shift key is not held
 * it toggles the single id (idempotent on/off). This matches the common OS
 * convention where Ctrl/Cmd+Click toggles without moving anchor — but for
 * simplicity we use plain click as toggle.
 */
export function toggleSingle<T>(current: ReadonlySet<T>, id: T): Set<T> {
  const next = new Set(current);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/**
 * Compute range select for per-experiment evidence maps. Given a map of
 * expId -> Set<evId>, add the range between anchor and target within the
 * specified experiment's visible evidence order.
 */
export function rangeSelectEvidence(
  current: Readonly<Record<string, ReadonlySet<string>>>,
  expId: string,
  visibleOrder: readonly string[],
  anchor: { expId: string; evId: string } | null,
  targetEvId: string,
): Record<string, Set<string>> {
  const next: Record<string, Set<string>> = {};
  // Copy other experiments
  for (const k of Object.keys(current)) {
    if (k !== expId) next[k] = new Set(current[k]);
  }
  const expSet = new Set(current[expId] || []);

  if (anchor && anchor.expId === expId) {
    const anchorIdx = visibleOrder.indexOf(anchor.evId);
    const targetIdx = visibleOrder.indexOf(targetEvId);
    if (anchorIdx !== -1 && targetIdx !== -1) {
      const start = Math.min(anchorIdx, targetIdx);
      const end = Math.max(anchorIdx, targetIdx);
      for (let i = start; i <= end; i++) expSet.add(visibleOrder[i]);
      next[expId] = expSet;
      return next;
    }
  }
  expSet.add(targetEvId);
  next[expId] = expSet;
  return next;
}
