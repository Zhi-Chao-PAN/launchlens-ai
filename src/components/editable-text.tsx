"use client";

export type EditableTextProps = {
  label: string;
  value: string;
  /** Number of visible text rows. Defaults to 3. */
  rows?: number;
  /** Called with the new value on every change. */
  onCommit: (value: string) => void;
};

/**
 * Tiny controlled textarea wrapper.
 *
 * Used by the local launch-workspace's `<EditableLines>` component
 * to back the list-shape editors (target users, pains, MVP scope,
 * etc.). Kept intentionally minimal — no debounce, no submit-button,
 * no validation — so the surrounding component owns the edit / save
 * flow.
 */
export function EditableText({
  label,
  value,
  rows = 3,
  onCommit,
}: EditableTextProps) {
  return (
    <textarea
      aria-label={label}
      value={value}
      rows={rows}
      onChange={(event) => onCommit(event.target.value)}
      className="w-full resize-y rounded-md border border-input bg-input px-3 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-[var(--ring-color)]"
    />
  );
}