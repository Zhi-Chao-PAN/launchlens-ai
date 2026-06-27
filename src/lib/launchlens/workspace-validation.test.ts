import { describe, expect, it } from "vitest";

import { exampleWorkspaces } from "./example-workspaces";
import { createExecutionState } from "./execution";
import {
  isLaunchLensInput,
  isLaunchLensWorkspace,
  isRecord,
  isUuid,
  parseWorkspaceSnapshot,
} from "./workspace-validation";

describe("workspace validation", () => {
  const example = exampleWorkspaces[0];

  it("accepts complete LaunchLens workspace snapshots", () => {
    expect(isLaunchLensWorkspace(example.workspace)).toBe(true);
    expect(
      parseWorkspaceSnapshot({
        title: "  Activation workspace  ",
        input: example.input,
        workspace: example.workspace,
      }),
    ).toEqual({
      title: "Activation workspace",
      input: example.input,
      workspace: example.workspace,
      execution: createExecutionState(example.workspace),
    });
  });

  it("rejects partial nested workspace structures", () => {
    expect(
      isLaunchLensWorkspace({
        ...example.workspace,
        landingPage: {
          headline: "Incomplete",
        },
      }),
    ).toBe(false);
  });

  it("falls back to the workspace headline when title is empty", () => {
    expect(
      parseWorkspaceSnapshot({
        input: example.input,
        workspace: example.workspace,
      })?.title,
    ).toBe(example.workspace.landingPage.headline);
  });

  it("strips unknown fields from accepted snapshots", () => {
    const payload = parseWorkspaceSnapshot({
      ignored: "top-level",
      input: { ...example.input, ignored: "input" },
      workspace: {
        ...example.workspace,
        ignored: "workspace",
        landingPage: {
          ...example.workspace.landingPage,
          ignored: "landing",
        },
      },
    });

    expect(payload).not.toBeNull();
    expect(payload).not.toHaveProperty("ignored");
    expect(payload?.input).not.toHaveProperty("ignored");
    expect(payload?.workspace).not.toHaveProperty("ignored");
    expect(payload?.workspace.landingPage).not.toHaveProperty("ignored");
  });

  it("preserves valid sourceBrief provenance on snapshots", () => {
    const sourceBrief = {
      source: "launchlens-research-studio" as const,
      sessionId: "rs-session-42",
      exportedAt: "2026-06-28T00:00:00.000Z",
      opportunityScore: 82,
      riskScore: 31,
    };
    const payload = parseWorkspaceSnapshot({
      input: example.input,
      workspace: {
        ...example.workspace,
        sourceBrief,
      },
    });

    expect(payload?.workspace.sourceBrief).toEqual(sourceBrief);
  });

  it("rejects invalid sourceBrief provenance on snapshots", () => {
    expect(
      parseWorkspaceSnapshot({
        input: example.input,
        workspace: {
          ...example.workspace,
          sourceBrief: {
            source: "launchlens-research-studio",
            sessionId: "",
            exportedAt: "not-a-date",
            opportunityScore: 82,
            riskScore: 31,
          },
        },
      }),
    ).toBeNull();
  });

  it("rejects pathological array counts and invalid timestamps", () => {
    expect(
      parseWorkspaceSnapshot({
        input: example.input,
        workspace: {
          ...example.workspace,
          targetUsers: Array.from({ length: 25 }, () => "user"),
        },
      }),
    ).toBeNull();
    expect(
      parseWorkspaceSnapshot({
        input: example.input,
        workspace: {
          ...example.workspace,
          generatedAt: "not-a-date",
        },
      }),
    ).toBeNull();
  });

  it("accepts only version 4 UUIDs", () => {
    expect(isUuid("a5ff00db-60da-4b20-9468-751ce404b289")).toBe(true);
    expect(isUuid("../private-workspace")).toBe(false);
    expect(isUuid("a5ff00db-60da-1b20-9468-751ce404b289")).toBe(false);
  });
  it("rejects workspace objects with missing required fields", () => {
    const incomplete = { provider: "mock" };
    expect(isLaunchLensWorkspace(incomplete)).toBe(false);
  });

  it("rejects non-object values gracefully", () => {
    expect(isLaunchLensWorkspace(null)).toBe(false);
    expect(isLaunchLensWorkspace(undefined)).toBe(false);
    expect(isLaunchLensWorkspace("string")).toBe(false);
    expect(isLaunchLensWorkspace(42)).toBe(false);
    expect(isLaunchLensWorkspace([])).toBe(false);
  });

  it("rejects input objects with missing required string fields", () => {
    expect(isLaunchLensInput({ idea: "x" })).toBe(false);
    expect(isLaunchLensInput({ idea: "", audience: "", market: "" })).toBe(false);
  });

  it("isRecord correctly identifies plain objects", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
    expect(isRecord([])).toBe(false);
    expect(isRecord("string")).toBe(false);
  });

  it("rejects workspaces where backlog is not an array", () => {
    const ws = { ...example.workspace, backlog: "not an array" };
    expect(isLaunchLensWorkspace(ws)).toBe(false);
  });
});

describe("isUuid edge cases", () => {
  it("rejects empty strings and non-string inputs", () => {
    expect(isUuid("")).toBe(false);
    expect(isUuid("   ")).toBe(false);
  });

  it("rejects UUIDs with wrong version nibble or variant bits", () => {
    // v1 (time-based) UUID should be rejected (we require v4)
    expect(isUuid("a5ff00db-60da-1b20-9468-751ce404b289")).toBe(false);
    // v4 with bad variant (8 -> reserved)
    expect(isUuid("a5ff00db-60da-4b20-c468-751ce404b289")).toBe(false);
    // correct v4 RFC variant
    expect(isUuid("a5ff00db-60da-4b20-9468-751ce404b289")).toBe(true);
  });

  it("rejects UUIDs with surrounding whitespace or extra characters", () => {
    expect(isUuid(" a5ff00db-60da-4b20-9468-751ce404b289")).toBe(false);
    expect(isUuid("a5ff00db-60da-4b20-9468-751ce404b289 ")).toBe(false);
    expect(isUuid("a5ff00db-60da-4b20-9468-751ce404b289-extra")).toBe(false);
  });



  it("isRecord rejects arrays, null, and primitives", () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
    expect(isRecord([])).toBe(false);
    expect(isRecord("string")).toBe(false);
    expect(isRecord(42)).toBe(false);
    expect(isRecord(true)).toBe(false);
  });

  it("isRecord accepts plain objects", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ key: "value" })).toBe(true);
    expect(isRecord(Object.create(null))).toBe(true);
  });

  it("isUuid requires exactly 36 chars in v4 format", () => {
    expect(isUuid("a1b2c3d4-1234-4abc-8def-123456789ab")).toBe(false);  // 35
    expect(isUuid("a1b2c3d4-1234-4abc-8def-123456789abcd")).toBe(false); // 37
  });

  it("isUuid validates the v4 version nibble", () => {
    expect(isUuid("a1b2c3d4-1234-1abc-8def-123456789abc")).toBe(false); // v1
    expect(isUuid("a1b2c3d4-1234-4abc-8def-123456789abc")).toBe(true);  // v4
  });

  it("isUuid validates the variant nibble (8/9/a/b)", () => {
    expect(isUuid("a1b2c3d4-1234-4abc-0def-123456789abc")).toBe(false); // 0
    expect(isUuid("a1b2c3d4-1234-4abc-7def-123456789abc")).toBe(false); // 7
    expect(isUuid("a1b2c3d4-1234-4abc-cdef-123456789abc")).toBe(false); // c
  });



  it("isUuid rejects empty strings and whitespace", () => {
    expect(isUuid("")).toBe(false);
    expect(isUuid("   ")).toBe(false);
  });

  it("isUuid rejects invalid uuid formats", () => {
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("12345")).toBe(false);
    expect(isUuid("g0000000-0000-0000-0000-000000000000")).toBe(false);
  });

  it("isUuid accepts both uppercase and lowercase hex v4 UUIDs", () => {
    expect(isUuid("a1b2c3d4-1234-4abc-8def-123456789abc")).toBe(true);
    expect(isUuid("A1B2C3D4-1234-4ABC-8DEF-123456789ABC")).toBe(true);
  });

});
