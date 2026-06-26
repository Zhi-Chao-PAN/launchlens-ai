import { CheckCircle2, type LucideIcon } from "lucide-react";
import { cleanBullets } from "@/lib/launchlens/bullets";

/**
 * A reusable bullet-list component used by both the launch-workspace
 * sections (target users, pain map, MVP scope, landing-page proof
 * bullets, pricing tiers, launch plan) and the share view's
 * read-only equivalent.
 *
 * Behaviour:
 *   - Empty / whitespace-only / '-' / duplicate bullets are filtered
 *     out via @/lib/launchlens/bullets#cleanBullets
 *   - The list is keyed by position (index), not by content, because
 *     two identical bullets should both render and the list is not
 *     reorderable
 *   - The icon is `CheckCircle2` in the accent colour by default; the
 *     share view's landing-page section overrides it to a `Star` in
 *     amber to distinguish proof bullets
 */
export function Bullets({
  items,
  icon: Icon = CheckCircle2,
  iconClassName = "text-accent",
  itemClassName,
  max,
  ariaLabel,
}: {
  items: readonly string[];
  icon?: LucideIcon;
  iconClassName?: string;
  itemClassName?: string;
  /** Optional cap on the number of rendered items. Defaults to 12. */
  max?: number;
  /** Optional accessible label for the outer list (default: omitted). */
  ariaLabel?: string;
}) {
  return (
    <ul className="space-y-3" aria-label={ariaLabel}>
      {cleanBullets(items, { max }).map((item, index) => (
        <li
          key={index}
          className={`flex gap-3 text-sm leading-6 text-foreground/80 ${itemClassName ?? ""}`}
        >
          <Icon
            className={`mt-1 size-4 shrink-0 ${iconClassName}`}
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
