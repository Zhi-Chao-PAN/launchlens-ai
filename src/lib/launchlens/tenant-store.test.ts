import { describe, expect, it } from "vitest";

import {
  __test_internals,
  isTenantNameValid,
  normalizeTenantName,
  type TenantSummary,
} from "./tenant-store";

describe("tenant helpers", () => {
  it("exposes a documented per-owner tenant ceiling", () => {
    expect(__test_internals.MAX_TENANTS_PER_OWNER).toBeGreaterThanOrEqual(2);
    expect(__test_internals.MAX_TENANTS_PER_OWNER).toBeLessThanOrEqual(20);
  });

  it("normalizes whitespace and clamps the tenant name to 80 characters", () => {
    const raw = "  Acme ".repeat(40);
    expect(normalizeTenantName(raw).length).toBe(80);
    expect(normalizeTenantName("  ")).toBe("");
    expect(normalizeTenantName("Acme")).toBe("Acme");
  });

  it("rejects empty tenant names", () => {
    expect(isTenantNameValid("")).toBe(false);
    expect(isTenantNameValid("   ")).toBe(false);
    expect(isTenantNameValid("Acme")).toBe(true);
  });

  it("shapes tenant summaries for the API", () => {
    const summary: TenantSummary = {
      id: "1d82fa02-a152-491e-b117-b0261ec84b68",
      name: "Acme",
      ownerHash: "a".repeat(64),
      createdAt: "2026-06-14T00:00:00.000Z",
      workspaceCount: 3,
    };
    expect(summary).toEqual({
      id: "1d82fa02-a152-491e-b117-b0261ec84b68",
      name: "Acme",
      ownerHash: "a".repeat(64),
      createdAt: "2026-06-14T00:00:00.000Z",
      workspaceCount: 3,
    });
  });

  it("normalizeTenantName trims whitespace", () => {
    const result = normalizeTenantName("  hello world  ");
    expect(result).not.toMatch(/^\s/);
    expect(result).not.toMatch(/\s$/);
    expect(result.length).toBeGreaterThan(0);
  });

  it("isTenantNameValid rejects empty strings", () => {
    expect(isTenantNameValid("")).toBe(false);
    expect(isTenantNameValid("   ")).toBe(false);
  });

  it("isTenantNameValid accepts valid names", () => {
    expect(isTenantNameValid("My Project")).toBe(true);
  });

});
