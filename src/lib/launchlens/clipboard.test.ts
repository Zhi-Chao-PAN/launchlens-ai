import { describe, expect, it } from "vitest";

import { copyTextToClipboard, downloadTextFile } from "./clipboard";
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

  it("handles very long names by truncating to exactly 60 chars of slug", () => {
    const long = "abcdefghij".repeat(20); // 200 chars
    const md = safeMarkdownFilename({ projectName: long });
    const json = safeJsonFilename({ projectName: long });
    expect(md.endsWith(".md")).toBe(true);
    expect(json.endsWith(".json")).toBe(true);
    expect(md.replace(/\.md$/, "").length).toBe(60);
    expect(json.replace(/\.json$/, "").length).toBe(60);
  });

  it("returns default filename when only punctuation is provided", () => {
    expect(safeMarkdownFilename({ projectName: "!!!???..." })).toBe("launchlens-workspace.md");
    expect(safeJsonFilename({ projectName: "---___===" })).toBe("launchlens-workspace.json");
  });

  it("handles mixed case and preserves lowercase", () => {
    expect(safeMarkdownFilename({ projectName: "Hello World 123" })).toBe("hello-world-123.md");
  });

  it("replaces forward slashes and backslashes with hyphens", () => {
    expect(safeMarkdownFilename({ projectName: "foo/bar/baz" })).toBe("foo-bar-baz.md");
    expect(safeJsonFilename({ projectName: "foo/bar/baz" })).toBe("foo-bar-baz.json");
  });

  it('handles mixed case and converts to lowercase', () => {
    expect(safeMarkdownFilename({ projectName: 'Hello World 123' })).toBe('hello-world-123.md');
  });

  it('handles slashes and dots in project name', () => {
    expect(safeMarkdownFilename({ projectName: 'foo/bar.baz' })).toBe('foo-bar-baz.md');
    expect(safeJsonFilename({ projectName: 'foo/bar.baz' })).toBe('foo-bar-baz.json');
  });



  it("safeJsonFilename sanitizes special characters in projectName", () => {
    const result = safeJsonFilename({ projectName: "Test/with:special*chars?<>|" });
    expect(result).not.toContain("/");
    expect(result).not.toContain(":");
    expect(result).not.toContain("*");
    expect(result).not.toContain("?");
    expect(result).toContain("test");
  });

  it("safeJsonFilename always ends with .json extension", () => {
    expect(safeJsonFilename({ projectName: "my workspace" })).toMatch(/\.json$/);
    expect(safeJsonFilename({})).toMatch(/\.json$/);
    expect(safeJsonFilename({ projectName: "" })).toMatch(/\.json$/);
  });

  it("copyTextToClipboard returns a boolean result", async () => {
    const result = await copyTextToClipboard("test content");
    expect(typeof result).toBe("boolean");
  });

  it("downloadTextFile runs without throwing in jsdom", () => {
    // jsdom doesn't have full download support, just verify it doesn't crash
    expect(() => {
      downloadTextFile("test content", "test.txt", "text/plain");
    }).not.toThrow();
  });

});
