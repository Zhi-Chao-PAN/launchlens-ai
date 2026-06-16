import { describe, expect, it } from "vitest";

import {
  describeWorkspaceRole,
  isWorkspaceRole,
  workspaceRoleAtLeast,
  WORKSPACE_ROLES,
} from "./workspace-rbac";

describe("workspace RBAC", () => {
  it("recognizes the documented roles", () => {
    expect(WORKSPACE_ROLES).toEqual(["owner", "editor", "viewer"]);
    for (const role of WORKSPACE_ROLES) {
      expect(isWorkspaceRole(role)).toBe(true);
    }
    expect(isWorkspaceRole("admin")).toBe(false);
    expect(isWorkspaceRole(null)).toBe(false);
  });

  it("orders roles so owner can do everything an editor can do", () => {
    expect(workspaceRoleAtLeast("owner", "owner")).toBe(true);
    expect(workspaceRoleAtLeast("owner", "editor")).toBe(true);
    expect(workspaceRoleAtLeast("owner", "viewer")).toBe(true);
    expect(workspaceRoleAtLeast("editor", "owner")).toBe(false);
    expect(workspaceRoleAtLeast("editor", "editor")).toBe(true);
    expect(workspaceRoleAtLeast("editor", "viewer")).toBe(true);
    expect(workspaceRoleAtLeast("viewer", "owner")).toBe(false);
    expect(workspaceRoleAtLeast("viewer", "editor")).toBe(false);
    expect(workspaceRoleAtLeast("viewer", "viewer")).toBe(true);
  });

  it("returns a human-readable description for each role", () => {
    expect(describeWorkspaceRole("owner")).toMatch(/Full control/);
    expect(describeWorkspaceRole("editor")).toMatch(/save snapshots/);
    expect(describeWorkspaceRole("viewer")).toMatch(/read the workspace/);
  });

  it("isWorkspaceRole returns false for empty string", () => {
    expect(isWorkspaceRole("")).toBe(false);
  });

  it("isWorkspaceRole returns false for numeric strings", () => {
    expect(isWorkspaceRole("123")).toBe(false);
  });

  it("describeWorkspaceRole returns a non-empty string for every role", () => {
    for (const role of WORKSPACE_ROLES) {
      const desc = describeWorkspaceRole(role);
      expect(typeof desc).toBe("string");
      expect(desc.length).toBeGreaterThan(0);
    }
  });

  it("describeWorkspaceRole returns the same value for the same input (stable)", () => {
    expect(describeWorkspaceRole("owner")).toBe(describeWorkspaceRole("owner"));
    expect(describeWorkspaceRole("editor")).toBe(describeWorkspaceRole("editor"));
  });
});
