import { describe, expect, it } from "vitest";

import { safeJsonFilename } from "./json-export";
import { safeMarkdownFilename } from "./markdown-export";

describe("cross-exporter filename parity", () => {
  it("markdown and json slugifiers agree on default and slug output", () => {
    expect(safeMarkdownFilename({})).toBe("launchlens-workspace.md");
    expect(safeJsonFilename({})).toBe("launchlens-workspace.json");

    expect(
      safeMarkdownFilename({ projectName: "Acme Launch" }),
    ).toBe("acme-launch.md");
    expect(safeJsonFilename({ projectName: "Acme Launch" })).toBe(
      "acme-launch.json",
    );

    const long = "a".repeat(200);
    expect(
      Number(safeMarkdownFilename({ projectName: long }).length - ".md".length),
    ).toBeLessThanOrEqual(60);
    expect(
      Number(safeJsonFilename({ projectName: long }).length - ".json".length),
    ).toBeLessThanOrEqual(60);
  });

  it("collapses repeated separators and trims edges", () => {
    expect(
      safeMarkdownFilename({ landingPage: { headline: "  Hello---World!!!" } }),
    ).toBe("hello-world.md");
    expect(
      safeJsonFilename({ landingPage: { headline: "  Hello---World!!!" } }),
    ).toBe("hello-world.json");
  });
});
