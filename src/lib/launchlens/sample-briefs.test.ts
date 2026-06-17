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

  it("every sample brief has a non-empty input.idea, input.audience, and input.market", () => {
    for (const brief of sampleBriefs) {
      expect(typeof brief.input.idea).toBe("string");
      expect(brief.input.idea.length).toBeGreaterThan(5);
      expect(typeof brief.input.audience).toBe("string");
      expect(brief.input.audience.length).toBeGreaterThan(2);
      expect(typeof brief.input.market).toBe("string");
      expect(brief.input.market.length).toBeGreaterThan(2);
    }
  });

  it("sample brief ids are unique", () => {
    const ids = sampleBriefs.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });



  it("every sample brief has a label and input.tone", () => {
    for (const brief of sampleBriefs) {
      expect(typeof brief.label).toBe("string");
      expect(brief.label.length).toBeGreaterThan(0);
      expect(typeof brief.input.tone).toBe("string");
      expect(brief.input.tone.length).toBeGreaterThan(0);
    }
  });

  it("sample brief ids use lowercase kebab-case", () => {
    for (const brief of sampleBriefs) {
      expect(brief.id).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

});
