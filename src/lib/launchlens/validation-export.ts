import { SIGNAL_LABELS, WEIGHT_LABELS } from "./evidence-labels";
import { EXPERIMENT_STATUS_LABELS } from "./experiment-status-labels";
import type { ConfidenceLevel, ValidationExperiment } from "./execution";
import { pinnedFirst } from "./pinned-first";
import { buildSafeFilename } from "./safe-filename";
import { yamlQuote } from "./yaml-quote";

const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

type ValidationExportOptions = {
  now?: Date;
  formatDate?: (isoDate: string) => string;
};

const defaultFormatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString();

const timestampFor = (now: Date | undefined) => (now ?? new Date()).toISOString();

const yamlList = (items: string[]) =>
  items.length ? `[${items.map((item) => yamlQuote(item)).join(", ")}]` : "[]";

export function validationExperimentToMarkdown(
  experiment: ValidationExperiment,
  options: ValidationExportOptions = {},
) {
  const formatDate = options.formatDate ?? defaultFormatDate;
  const pinnedEvidenceCount = experiment.evidence.filter((item) => item.pinned).length;

  const lines = [
    "---",
    `title: ${yamlQuote(experiment.assumption)}`,
    `status: ${experiment.status}`,
    `confidence: ${experiment.confidence}`,
    `evidence_count: ${experiment.evidence.length}`,
    `pinned_evidence: ${pinnedEvidenceCount}`,
    `archived: ${experiment.archived ? "true" : "false"}`,
    `tags: ${yamlList(experiment.tags ?? [])}`,
    `updated: ${timestampFor(options.now)}`,
    "source: launchlens-ai",
    "---",
    "",
    `# ${experiment.assumption}`,
    "",
    `- **Status**: ${EXPERIMENT_STATUS_LABELS[experiment.status]}`,
    `- **Confidence**: ${CONFIDENCE_LABELS[experiment.confidence]}${
      experiment.confidenceManual ? " (manual)" : ""
    }`,
    `- **Evidence**: ${experiment.evidence.length} items`,
    "",
    "## Evidence",
    "",
  ];

  if (experiment.evidence.length === 0) {
    lines.push("_No evidence recorded yet._");
  } else {
    [...experiment.evidence].sort(pinnedFirst).forEach((item, index) => {
      lines.push(
        `### ${item.pinned ? "Pinned " : ""}${index + 1}. ${SIGNAL_LABELS[item.signal]} - ${
          item.source
        }`,
        "",
        `- **Weight**: ${WEIGHT_LABELS[item.weight]}`,
        `- **Observed**: ${formatDate(item.observedAt)}`,
        "",
        item.note,
        "",
      );
    });
  }

  return lines.join("\n");
}

export function validationExperimentToJson(experiment: ValidationExperiment) {
  return JSON.stringify(experiment, null, 2);
}

export function validationExperimentFilename(
  experiment: ValidationExperiment,
  ext: string,
  now?: Date,
) {
  return buildSafeFilename({
    source: experiment.assumption,
    ext,
    fallback: "hypothesis",
    now,
  });
}

export function validationBoardToMarkdown(
  experiments: ValidationExperiment[],
  options: ValidationExportOptions = {},
) {
  const formatDate = options.formatDate ?? defaultFormatDate;
  const allTags = Array.from(
    new Set(experiments.flatMap((experiment) => experiment.tags ?? [])),
  );
  const supportedCount = experiments.filter((item) => item.status === "supported").length;
  const refutedCount = experiments.filter((item) => item.status === "refuted").length;
  const testingCount = experiments.filter((item) => item.status === "testing").length;
  const untestedCount = experiments.filter((item) => item.status === "untested").length;

  const lines: string[] = [
    "---",
    `title: ${yamlQuote("Validation Board")}`,
    "source: launchlens-ai",
    `hypotheses: ${experiments.length}`,
    `supported: ${supportedCount}`,
    `refuted: ${refutedCount}`,
    `testing: ${testingCount}`,
    `untested: ${untestedCount}`,
    `tags: ${yamlList(allTags)}`,
    `updated: ${timestampFor(options.now)}`,
    "---",
    "",
    "# Validation Board",
    "",
    `- **Hypotheses**: ${experiments.length} total - ${supportedCount} supported, ${refutedCount} refuted, ${testingCount} testing, ${untestedCount} untested`,
    "",
  ];

  experiments.forEach((experiment, experimentIndex) => {
    lines.push(
      `## ${experimentIndex + 1}. ${experiment.assumption}`,
      "",
      `- **Status**: ${EXPERIMENT_STATUS_LABELS[experiment.status]}`,
      `- **Confidence**: ${CONFIDENCE_LABELS[experiment.confidence]}${
        experiment.confidenceManual ? " (manual)" : " (auto)"
      }`,
      `- **Evidence**: ${experiment.evidence.length} items`,
      "",
    );

    if (experiment.evidence.length === 0) {
      lines.push("_No evidence recorded yet._", "");
      return;
    }

    experiment.evidence.forEach((item, itemIndex) => {
      lines.push(
        `### ${itemIndex + 1}. ${SIGNAL_LABELS[item.signal]} - ${item.source}`,
        "",
        `- **Weight**: ${WEIGHT_LABELS[item.weight]}`,
        `- **Observed**: ${formatDate(item.observedAt)}`,
        "",
        item.note,
        "",
      );
    });
  });

  return lines.join("\n");
}

export function validationBoardToJson(experiments: ValidationExperiment[]) {
  return JSON.stringify(experiments, null, 2);
}

export function validationBoardFilename(ext: string, now = new Date()) {
  const timestamp = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
  return `validation-board-${timestamp}.${ext}`;
}
