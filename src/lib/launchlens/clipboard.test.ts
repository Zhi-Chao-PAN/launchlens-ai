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

  it("strips emoji and special unicode characters from filenames", () => {
    const name = { projectName: "My ?? Launch! @2024" };
    expect(safeMarkdownFilename(name)).toBe("my-launch-2024.md");
    expect(safeJsonFilename(name)).toBe("my-launch-2024.json");
  });

  it("handles empty/whitespace-only project names gracefully", () => {
    expect(safeMarkdownFilename({ projectName: "" })).toBe("launchlens-workspace.md");
    expect(safeMarkdownFilename({ projectName: "   " })).toBe("launchlens-workspace.md");
    expect(safeJsonFilename({ projectName: "" })).toBe("launchlens-workspace.json");
  });

  it("preserves numbers and hyphens correctly", () => {
    expect(safeMarkdownFilename({ projectName: "v2.1-beta-3" })).toBe("v2-1-beta-3.md");
    expect(safeJsonFilename({ projectName: "v2.1-beta-3" })).toBe("v2-1-beta-3.json");
  });


  it("uses landing page headline when project name is missing", () => {
    const result = safeMarkdownFilename({ landingPage: { headline: "Great Product Launch" } });
    expect(result).toBe("great-product-launch.md");
    const json = safeJsonFilename({ landingPage: { headline: "Great Product Launch" } });
    expect(json).toBe("great-product-launch.json");
  });

  it("always returns the correct file extension (.md / .json)", () => {
    expect(safeMarkdownFilename({})).toMatch(/\.md$/);
    expect(safeJsonFilename({})).toMatch(/\.json$/);
    expect(safeMarkdownFilename({ projectName: "test" })).toMatch(/\.md$/);
    expect(safeJsonFilename({ projectName: "test" })).toMatch(/\.json$/);
  });

  it("prefers projectName over landingPage headline when both are present", () => {
    const both = { projectName: "Project Alpha", landingPage: { headline: "Landing Beta" } };
    expect(safeMarkdownFilename(both)).toBe("project-alpha.md");
    expect(safeJsonFilename(both)).toBe("project-alpha.json");
  });
});
