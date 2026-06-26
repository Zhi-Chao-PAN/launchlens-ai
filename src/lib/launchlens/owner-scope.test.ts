import { describe, expect, it } from "vitest";
import { ownerScopeLabel } from "./owner-scope";

describe("ownerScopeLabel", () => {
  it("returns 'Recovery-linked' when the token starts with 'acct_'", () => {
    expect(ownerScopeLabel("acct_abc123")).toBe("Recovery-linked");
  });

  it("returns 'This browser' for a fresh, device-local token", () => {
    expect(ownerScopeLabel("local_abc123")).toBe("This browser");
  });

  it("returns 'This browser' for an empty token", () => {
    expect(ownerScopeLabel("")).toBe("This browser");
  });

  it("returns 'This browser' when 'acct_' appears later (not at the start)", () => {
    expect(ownerScopeLabel("xx_acct_yy")).toBe("This browser");
  });

  it("is case-sensitive on the prefix", () => {
    expect(ownerScopeLabel("ACCT_abc")).toBe("This browser");
  });

  it("accepts acct_ tokens of any length", () => {
    expect(ownerScopeLabel("acct_")).toBe("Recovery-linked");
    expect(ownerScopeLabel("acct_" + "x".repeat(1000))).toBe("Recovery-linked");
  });
});
