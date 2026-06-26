/**
 * Map a free-text tag to the Tailwind classes for its pill on the
 * validation board. The function uses a small decision tree of
 * keyword patterns to assign each tag a colour family, with a
 * sensible muted fallback for tags that match no pattern.
 *
 * The pattern order matters: the first match wins. The categories
 * in priority order are
 *
 *   1. critical (red)    - blocked, urgent, hotfix, p0, must, etc.
 *   2. warning  (amber)  - risk, caution, p1, flag, etc.
 *   3. won      (green)  - validated, shipped, done, launch, won, pivot
 *   4. testing  (sky)    - testing, experiment, running, wip
 *   5. backlog  (violet) - idea, nice, later, backlog, maybe
 *   6. fallback (muted)  - everything else
 *
 * Matching is case-insensitive. The keyword check is intentionally
 * permissive ("ship" matches "shipped") so that short and long
 * variants of the same word all land in the same colour.
 */
export type TagStyle = { pill: string; text: string };

export const TAG_STYLE_MUTED: TagStyle = { pill: "bg-muted", text: "text-muted" };

const PATTERNS: Array<[RegExp, TagStyle]> = [
  [/(critical|block(ed|er)?|urgent|hotfix|p0|must)/, { pill: "bg-red-500/15", text: "text-red-600 dark:text-red-300" }],
  [/(warn|risk|caution|p1|todo|flag)/, { pill: "bg-amber-500/15", text: "text-amber-700 dark:text-amber-300" }],
  [/(validated|shipped|done|launch|live|won|pivot)/, { pill: "bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-300" }],
  [/(testing|experiment|running|wip)/, { pill: "bg-sky-500/15", text: "text-sky-700 dark:text-sky-300" }],
  [/(idea|nice|later|backlog|maybe)/, { pill: "bg-violet-500/15", text: "text-violet-700 dark:text-violet-300" }],
];

export function tagStyle(tag: string): TagStyle {
  const t = (tag ?? "").toLowerCase();
  for (const [pattern, style] of PATTERNS) {
    if (pattern.test(t)) return style;
  }
  return TAG_STYLE_MUTED;
}
