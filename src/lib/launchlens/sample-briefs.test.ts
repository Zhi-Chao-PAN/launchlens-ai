import { describe, expect, it } from "vitest";

import { sampleBriefs } from "./sample-briefs";

describe("sampleBriefs", () => {
  it("ships three sample briefs with unique ids", () => {
    expect(sampleBriefs).toHaveLength(3);
    const ids = new Set(sampleBriefs.map((b) => b.id));
    expect(ids.size).toBe(3);
  });

  it("every brief has a non-empty label and populated input fields", () => {
    for (const brief of sampleBriefs) {
      expect(brief.label.length).toBeGreaterThan(3);
      expect(brief.input.idea.length).toBeGreaterThan(20);
      expect(brief.input.audience.length).toBeGreaterThan(10);
      expect(brief.input.market.length).toBeGreaterThan(10);
      expect(brief.input.tone.length).toBeGreaterThan(3);
      expect(brief.input.constraints.length).toBeGreaterThan(10);
    }
  });

  it("ids are kebab-case slugs", () => {
    for (const brief of sampleBriefs) {
      expect(brief.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });
});
