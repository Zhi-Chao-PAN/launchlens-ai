"use client";

/**
 * Small "filter chip" button used by the validation board to switch
 * the active evidence filter for a single experiment.
 *
 * Two visual variants:
 *
 * - "filled"  (default): the active chip becomes a solid accent
 *   button. Used for the signal filter row.
 * - "ringed": the active chip is outlined with an accent ring. Used
 *   for the weight filter row, so the two rows read as distinct
 *   even when both have a chip selected.
 *
 * The chip is also the unit of the chip-row "active (currently
 * active)" affordance: the title is suffixed when the chip is
 * active so screen-reader users hear the current state.
 */
export type FilterChipVariant = "filled" | "ringed";

export type FilterChipProps = {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  title: string;
  /** "Filter evidence by <kind>: <value>. N items." */
  ariaLabelPrefix: string;
  /** Single-word value used in the aria-label (e.g. "supports"). */
  ariaValue: string;
  variant?: FilterChipVariant;
};

const BASE_CLASS =
  "rounded-full px-2 py-0.5 text-[10px] font-medium transition";

const VARIANT_CLASSES: Record<FilterChipVariant, { active: string; idle: string }> = {
  filled: {
    active: "bg-accent text-primary-text",
    idle: "bg-card text-muted hover:text-foreground",
  },
  ringed: {
    active: "bg-card ring-1 ring-accent text-foreground",
    idle: "bg-transparent text-muted hover:text-foreground",
  },
};

export function FilterChip({
  label,
  count,
  active,
  onClick,
  title,
  ariaLabelPrefix,
  ariaValue,
  variant = "filled",
}: FilterChipProps) {
  const classes = VARIANT_CLASSES[variant];
  const countWord = count === 1 ? "item" : "items";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title + (active ? " (currently active)" : "")}
      aria-label={`${ariaLabelPrefix}: ${ariaValue}. ${count} ${countWord}.`}
      className={`${BASE_CLASS} ${active ? classes.active : classes.idle}`}
    >
      {label} ({count})
    </button>
  );
}
