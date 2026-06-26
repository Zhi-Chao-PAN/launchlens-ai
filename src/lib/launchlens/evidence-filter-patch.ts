/**
 * Build the next evidenceFilters record after patching one
 * experiment's filter entry.
 *
 * The validation board keeps a `Record<experimentId, EvidenceFilter>`
 * (where the filter is `{ signal, weight }`) inside React state. Every
 * call site that wants to update the signal or weight for a single
 * experiment needs the same reducer shape:
 *
 *   setEvidenceFilters((prev) => ({
 *     ...prev,
 *     [experimentId]: { ...prev[experimentId], ...patch },
 *   }));
 *
 * Centralising it here keeps the three call sites (signal change,
 * weight change, reset) in lock-step — adding a new field to the
 * filter shape means updating one place, not three.
 */
export type EvidenceFilterLike = { signal: string; weight: string };

export function patchEvidenceFilter<F extends EvidenceFilterLike>(
  prev: Record<string, F>,
  experimentId: string,
  patch: Partial<Pick<F, "signal" | "weight">>,
  defaultFilter: F,
): Record<string, F> {
  const existing = prev[experimentId] || defaultFilter;
  return {
    ...prev,
    [experimentId]: { ...existing, ...patch } as F,
  };
}
