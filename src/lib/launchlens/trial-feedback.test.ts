import { describe, expect, it, afterEach, vi } from "vitest";
import { formatTrialFeedback } from "./trial-feedback";
import { readPreference, writePreference } from "./browser-preferences";

afterEach(() => vi.unstubAllGlobals());

describe("trial feedback", () => {
  it("exports only explicit feedback and preserves Chinese notes", () => {
    const result = formatTrialFeedback({goal: " 找第一位用户 ", outcome: "完成一次判断", blocker: "", reuse: "需要更多证据", mode: "Demo", ownerToken: "must-not-leak", workspace: "private-brief"} as Parameters<typeof formatTrialFeedback>[0]);
    expect(result).toContain("找第一位用户");
    expect(result).toContain("Not provided / 未填写");
    expect(result).toContain("not been submitted");
    expect(result).not.toContain("must-not-leak");
    expect(result).not.toContain("private-brief");
  });
});

describe("optional browser preferences", () => {
  it("works during server rendering", () => {
    expect(readPreference("locale")).toBeNull();
    expect(() => writePreference("locale", "en")).not.toThrow();
  });
  it("survives denied access to the storage object", () => {
    vi.stubGlobal("window", Object.defineProperty({}, "localStorage", {get() { throw new Error("SecurityError"); }}));
    expect(readPreference("locale")).toBeNull();
    expect(() => writePreference("locale", "en")).not.toThrow();
    expect(() => writePreference("locale", null)).not.toThrow();
  });
  it("survives storage operations failing", () => {
    const fail = () => { throw new Error("QuotaExceededError"); };
    vi.stubGlobal("window", {localStorage: {getItem: fail, setItem: fail, removeItem: fail}});
    expect(readPreference("locale")).toBeNull();
    expect(() => writePreference("locale", "en")).not.toThrow();
    expect(() => writePreference("locale", null)).not.toThrow();
  });
});
