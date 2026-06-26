"use client";

import { joinLines } from "@/lib/launchlens/join-lines";
import { splitLines } from "@/lib/launchlens/split-lines";
import { EditableText } from "./editable-text";

export type EditableLinesProps = {
  label: string;
  items: string[];
  /** Number of visible text rows. Defaults to 5 (list-shaped). */
  rows?: number;
  /** Called whenever the textarea content changes, with the parsed list. */
  onCommit: (items: string[]) => void;
};

/**
 * Controlled textarea wrapper that round-trips a list of strings.
 *
 * Renders one item per line via `joinLines`, and parses incoming
 * text back into a list via `splitLines` (which trims each line and
 * drops blanks). Editing the textarea therefore appears as live
 * list mutation in the parent without the parent owning the parsing
 * logic.
 */
export function EditableLines({
  label,
  items,
  rows = 5,
  onCommit,
}: EditableLinesProps) {
  return (
    <EditableText
      label={label}
      value={joinLines(items)}
      rows={rows}
      onCommit={(value) => onCommit(splitLines(value))}
    />
  );
}