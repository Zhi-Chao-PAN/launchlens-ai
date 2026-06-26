import type { ValidationExperiment } from "./execution";

export type ValidationSearchQuery = {
  required: string[];
  excluded: string[];
};

export function parseValidationSearchQuery(raw: string): ValidationSearchQuery {
  const required: string[] = [];
  const excluded: string[] = [];
  const pattern = /("([^"]+)"|(\S+))/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(raw)) !== null) {
    const token = (match[2] ?? match[3] ?? "").toLowerCase().trim();
    if (!token) {
      continue;
    }

    if (token.startsWith("-") && token.length > 1) {
      excluded.push(token.slice(1));
    } else {
      required.push(token);
    }
  }

  return { required, excluded };
}

export function validationExperimentSearchText(
  experiment: ValidationExperiment,
) {
  return [
    experiment.assumption,
    experiment.decision,
    experiment.nextAction,
    ...(experiment.tags ?? []),
    ...experiment.evidence.flatMap((item) => [
      item.note,
      item.source,
      item.signal,
      item.weight,
    ]),
  ]
    .join(" ")
    .toLowerCase();
}

export function matchesValidationExperimentSearch(
  experiment: ValidationExperiment,
  rawQuery: string,
) {
  const query = rawQuery.trim();
  if (!query) {
    return true;
  }

  const haystack = validationExperimentSearchText(experiment);
  const { required, excluded } = parseValidationSearchQuery(query);

  if (excluded.some((token) => haystack.includes(token))) {
    return false;
  }

  return required.every((token) => haystack.includes(token));
}
