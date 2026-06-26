import type { HypothesisChangeEvent, HypothesisChangeKind } from "./execution";
import {
  confidenceDescription,
  decisionDescription,
  statusDescription,
} from "./evidence-descriptions";

export type TimelineKindFilter = "all" | HypothesisChangeKind;

export const TIMELINE_KIND_FILTERS: Array<{
  id: TimelineKindFilter;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "created", label: "Created" },
  { id: "status", label: "Status" },
  { id: "confidence", label: "Confidence" },
  { id: "decision", label: "Decision" },
  { id: "evidence_added", label: "Evidence +" },
  { id: "evidence_removed", label: "Evidence -" },
  { id: "archived", label: "Archive" },
  { id: "pinned", label: "Pin" },
];

const TIMELINE_EVENT_LABELS: Record<HypothesisChangeKind, string> = {
  created: "Created",
  status: "Status",
  confidence: "Confidence",
  decision: "Decision updated",
  archived: "Archive changed",
  evidence_added: "Evidence added",
  evidence_removed: "Evidence removed",
  pinned: "Pin toggled",
};

const TOKEN_CLASSES: Record<string, string> = {
  supported: "text-signal-supports font-medium",
  refuted: "text-signal-challenges font-medium",
  testing: "text-signal-pending font-medium",
  untested: "text-muted-foreground",
  high: "text-signal-supports font-medium",
  medium: "text-amber-600 dark:text-amber-300 font-medium",
  low: "text-muted-foreground",
  proceed: "text-signal-supports font-medium",
  pivot: "text-signal-challenges font-medium",
  iterate: "text-signal-pending font-medium",
};

const STATUS_DOT_CLASSES: Record<string, string> = {
  supported: "bg-signal-supports",
  refuted: "bg-signal-challenges",
  testing: "bg-signal-pending",
  untested: "bg-muted-foreground/50",
};

const CONFIDENCE_DOT_CLASSES: Record<string, string> = {
  high: "bg-signal-supports",
  medium: "bg-amber-500",
  low: "bg-muted-foreground/50",
};

const DECISION_DOT_CLASSES: Record<string, string> = {
  proceed: "bg-signal-supports",
  pivot: "bg-signal-challenges",
  iterate: "bg-signal-pending",
};

export function timelineEventLabel(
  event: Pick<HypothesisChangeEvent, "kind" | "to">,
) {
  if (event.kind === "archived") {
    return event.to === "true" ? "Archived" : "Unarchived";
  }

  return TIMELINE_EVENT_LABELS[event.kind] ?? event.kind;
}

export function timelineEventIsTransition(kind: string) {
  return kind === "status" || kind === "confidence" || kind === "decision";
}

export function timelineEventDetail(
  event: Pick<HypothesisChangeEvent, "kind" | "source">,
) {
  if (timelineEventIsTransition(event.kind) || event.kind === "archived") {
    return "";
  }

  return event.source ?? "";
}

export function timelineTokenClass(value: string | null | undefined) {
  if (!value) {
    return "text-muted";
  }

  return TOKEN_CLASSES[value] ?? "text-muted";
}

export function timelineDotClass(kind: string, value: string | null | undefined) {
  if (kind === "status" && value) {
    return STATUS_DOT_CLASSES[value] ?? "bg-accent/70";
  }

  if (kind === "archived") {
    return "bg-muted-foreground/40";
  }

  if (kind === "confidence" && value) {
    return CONFIDENCE_DOT_CLASSES[value] ?? "bg-accent/70";
  }

  if (kind === "decision" && value) {
    return DECISION_DOT_CLASSES[value] ?? "bg-accent/70";
  }

  if (kind === "evidence_added") {
    return "bg-emerald-500/80";
  }

  if (kind === "evidence_removed") {
    return "bg-amber-500/80";
  }

  return "bg-accent/70";
}

export function timelineValueDescription(
  kind: string,
  value: string | null | undefined,
) {
  if (!value) {
    return String(value ?? "?");
  }

  if (kind === "status") {
    return statusDescription(value) || value;
  }

  if (kind === "confidence") {
    return confidenceDescription(value) || value;
  }

  if (kind === "decision") {
    return decisionDescription(value) || value;
  }

  return value;
}

export function timelineEventTitle(
  event: Pick<HypothesisChangeEvent, "kind" | "from" | "to" | "label">,
) {
  const label = timelineEventLabel(event);

  if (timelineEventIsTransition(event.kind)) {
    return `${label}: ${timelineValueDescription(
      event.kind,
      event.from,
    )} -> ${timelineValueDescription(event.kind, event.to)}`;
  }

  return label + (event.label ? ` - ${event.label}` : "");
}
