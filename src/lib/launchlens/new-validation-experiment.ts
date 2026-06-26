import {
  assumptionIdentity,
  type ValidationExperiment,
} from "./execution";

export type NewValidationExperimentInput = {
  assumption: string;
  index: number;
  tags?: string[];
};

export function createNewValidationExperiment({
  assumption,
  index,
  tags = [],
}: NewValidationExperimentInput): ValidationExperiment {
  return {
    id: assumptionIdentity(assumption, index),
    assumption,
    status: "untested",
    confidence: "low",
    confidenceManual: false,
    decision: "",
    nextAction: "",
    linkedTaskId: "",
    evidence: [],
    tags: tags.slice(0, 8),
  };
}

export function isDuplicateAssumption(
  assumption: string,
  experiments: Pick<ValidationExperiment, "assumption">[],
) {
  const normalized = assumption.trim().toLowerCase();

  return experiments.some(
    (experiment) => experiment.assumption.trim().toLowerCase() === normalized,
  );
}
