import { describe, expect, it } from "vitest";

import {
  createNewValidationExperiment,
  isDuplicateAssumption,
} from "./new-validation-experiment";

describe("createNewValidationExperiment", () => {
  it("creates a default untested validation experiment", () => {
    const experiment = createNewValidationExperiment({
      assumption: "Users need faster validation rituals",
      index: 2,
      tags: ["ritual", "speed"],
    });

    expect(experiment).toMatchObject({
      assumption: "Users need faster validation rituals",
      status: "untested",
      confidence: "low",
      confidenceManual: false,
      decision: "",
      nextAction: "",
      linkedTaskId: "",
      evidence: [],
      tags: ["ritual", "speed"],
    });
    expect(experiment.id).toMatch(/^assumption-/);
  });

  it("caps starter tags at eight", () => {
    const experiment = createNewValidationExperiment({
      assumption: "Users need tagging",
      index: 0,
      tags: Array.from({ length: 10 }, (_, index) => `tag-${index + 1}`),
    });

    expect(experiment.tags).toHaveLength(8);
    expect(experiment.tags[7]).toBe("tag-8");
  });
});

describe("isDuplicateAssumption", () => {
  it("compares assumptions case-insensitively after trimming", () => {
    expect(
      isDuplicateAssumption("  USERS NEED FASTER VALIDATION RITUALS ", [
        { assumption: "Users need faster validation rituals" },
      ]),
    ).toBe(true);
  });

  it("returns false for distinct assumptions", () => {
    expect(
      isDuplicateAssumption("Users want audit trails", [
        { assumption: "Users need faster validation rituals" },
      ]),
    ).toBe(false);
  });
});
