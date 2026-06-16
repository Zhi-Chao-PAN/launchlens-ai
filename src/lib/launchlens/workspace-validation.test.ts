import { describe, expect, it } from "vitest";

import { exampleWorkspaces } from "./example-workspaces";
import { createExecutionState } from "./execution";
import {
  isLaunchLensWorkspace,
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
});
