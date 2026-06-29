import type { HypothesisChangeEvent } from "@/lib/launchlens/execution";
import {
  confidenceSparklinePoints,
  statusRibbonSegments,
} from "@/lib/launchlens/validation-history-preview";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export type ValidationHistoryPreviewProps = {
  history: HypothesisChangeEvent[];
};

export function ValidationHistoryPreview({
  history,
}: ValidationHistoryPreviewProps) {
  const { t } = useLocale();
  const confidencePoints = confidenceSparklinePoints(history);
  const statusSegments = statusRibbonSegments(history);
  const hasConfidenceSparkline = confidencePoints.length > 0;
  const hasStatusRibbon = statusSegments.length > 0;

  if (!hasConfidenceSparkline && !hasStatusRibbon) {
    return null;
  }

  return (
    <div className="mt-4 space-y-1">
      {hasConfidenceSparkline && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase text-muted">{t("vHistory.confidence")}</span>
          <svg
            width={64}
            height={14}
            viewBox="0 0 64 14"
            aria-hidden="true"
            className="text-accent"
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={confidencePoints}
            />
          </svg>
        </div>
      )}
      {hasStatusRibbon && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase text-muted">{t("vHistory.status")}</span>
          <svg
            width={64}
            height={6}
            viewBox="0 0 64 6"
            role="img"
            aria-label={t("vHistory.ariaLabel")}
          >
            {statusSegments.map((segment, index) => (
              <rect
                key={`${segment.status}-${index}`}
                x={segment.x.toFixed(1)}
                y={1}
                width={Math.max(segment.width, 1).toFixed(1)}
                height={4}
                rx={1}
                className={segment.color}
                opacity={0.85}
              />
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}
