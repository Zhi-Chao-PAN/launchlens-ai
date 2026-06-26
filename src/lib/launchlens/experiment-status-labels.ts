import type { ExperimentStatus, ValidationExperiment } from "./execution";

export const EXPERIMENT_STATUS_LABELS: Record<ExperimentStatus, string> = {
  untested: "Untested",
  testing: "Testing",
  supported: "Supported",
  refuted: "Refuted",
};

export function experimentStatusLabel(status: ExperimentStatus) {
  return EXPERIMENT_STATUS_LABELS[status];
}

export function archivedStatusToneClass(status: ExperimentStatus) {
  if (status === "supported") {
    return "bg-signal-supports/20 text-signal-supports";
  }

  if (status === "refuted") {
    return "bg-signal-challenges/20 text-signal-challenges";
  }

  if (status === "testing") {
    return "bg-accent/20 text-accent";
  }

  return "bg-muted text-muted";
}

export function archivedStatusSummary(experiments: ValidationExperiment[]) {
  const summary: Record<string, number> = {};

  for (const experiment of experiments) {
    const key =
      {
        supported: "validated",
        refuted: "invalidated",
        testing: experiment.decision ? "decided" : "testing",
        untested: experiment.decision ? "decided" : "untested",
      }[experiment.status] ?? experiment.status;

    summary[key] = (summary[key] || 0) + 1;
  }

  return Object.entries(summary)
    .map(([key, value]) => `${value} ${key}`)
    .join(" | ");
}
