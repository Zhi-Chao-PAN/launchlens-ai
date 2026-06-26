import type { HypothesisChangeEvent } from "./execution";

const STATUS_RIBBON_CLASSES: Record<string, string> = {
  supported: "bg-signal-supports",
  refuted: "bg-signal-challenges",
  testing: "bg-signal-pending",
  untested: "bg-muted-foreground/40",
};

const CONFIDENCE_LEVEL_VALUES: Record<string, number> = {
  low: 0,
  medium: 0.5,
  high: 1,
};

export type StatusRibbonSegment = {
  x: number;
  width: number;
  color: string;
  status: string;
};

export function statusRibbonClass(status: string | null | undefined) {
  if (!status) {
    return "bg-muted-foreground/40";
  }

  return STATUS_RIBBON_CLASSES[status] ?? "bg-muted-foreground/40";
}

export function statusRibbonSegments(
  history: HypothesisChangeEvent[],
): StatusRibbonSegment[] {
  const statusEvents = history
    .filter((event) => event.kind === "created" || event.kind === "status")
    .sort((a, b) => Number(new Date(a.at)) - Number(new Date(b.at)));

  return statusEvents.map((event, index) => {
    const start = index / Math.max(1, statusEvents.length);
    const end = (index + 1) / Math.max(1, statusEvents.length);
    const width = Math.max(0, Math.min(1, end - start)) * 60;

    return {
      x: start * 60,
      width,
      color: statusRibbonClass(event.to),
      status: event.to ?? "",
    };
  });
}

export function confidenceSparklinePoints(history: HypothesisChangeEvent[]) {
  const confidenceEvents = history.filter(
    (event) => event.kind === "confidence" || event.kind === "created",
  );

  if (confidenceEvents.length < 2) {
    return "";
  }

  return confidenceEvents
    .map((event, index) => {
      const value = event.to
        ? CONFIDENCE_LEVEL_VALUES[event.to] ?? CONFIDENCE_LEVEL_VALUES.low
        : CONFIDENCE_LEVEL_VALUES.low;
      const x = (index / Math.max(1, confidenceEvents.length - 1)) * 60;
      const y = 12 - value * 10;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function hasHistoryPreview(history: HypothesisChangeEvent[]) {
  return (
    confidenceSparklinePoints(history).length > 0 ||
    statusRibbonSegments(history).length > 0
  );
}
