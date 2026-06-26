import { describe, expect, it } from "vitest";
import type { ValidationExperiment } from "./execution";
import {
  matchesValidationExperimentSearch,
  parseValidationSearchQuery,
} from "./validation-search";

const BASE_EXPERIMENT: ValidationExperiment = {
  id: "assumption-1",
  assumption:
    "The buyer values speed from idea to action more than perfect research.",
  status: "supported",
  confidence: "high",
  confidenceManual: false,
  decision: "Proceed with weekly activation fixes.",
  nextAction: "Interview five target users.",
  linkedTaskId: "task-1",
  tags: ["activation", "speed"],
  evidence: [
    {
      id: "evidence-1",
      note: "Four founders preferred a prioritized fix list.",
      source: "Founder interviews",
      signal: "supports",
      weight: "moderate",
      observedAt: "2026-06-12T05:10:00.000Z",
    },
  ],
};

describe("parseValidationSearchQuery", () => {
  it("splits required terms, excluded terms, and quoted phrases", () => {
    expect(parseValidationSearchQuery('speed -research "fix list"')).toEqual({
      required: ["speed", "fix list"],
      excluded: ["research"],
    });
  });
});

describe("matchesValidationExperimentSearch", () => {
  it("matches assumption, tags, decisions, actions, and evidence fields", () => {
    expect(matchesValidationExperimentSearch(BASE_EXPERIMENT, "activation")).toBe(
      true,
    );
    expect(
      matchesValidationExperimentSearch(BASE_EXPERIMENT, '"fix list"'),
    ).toBe(true);
    expect(
      matchesValidationExperimentSearch(BASE_EXPERIMENT, "not-present"),
    ).toBe(false);
  });

  it("treats negative-only queries as exclusion filters, not as match-none", () => {
    expect(
      matchesValidationExperimentSearch(BASE_EXPERIMENT, "-not-present"),
    ).toBe(true);
    expect(matchesValidationExperimentSearch(BASE_EXPERIMENT, "-speed")).toBe(
      false,
    );
  });

  it("requires included terms before applying exclusions", () => {
    expect(
      matchesValidationExperimentSearch(BASE_EXPERIMENT, "speed -speed"),
    ).toBe(false);
    expect(
      matchesValidationExperimentSearch(BASE_EXPERIMENT, "pricing -speed"),
    ).toBe(false);
  });
});
