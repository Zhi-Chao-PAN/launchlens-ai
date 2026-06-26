import { describe, expect, it } from "vitest";
import { tagStyle, TAG_STYLE_MUTED } from "./tag-style";

const styleToString = (s: { pill: string; text: string }) => `${s.pill} ${s.text}`;

describe("tagStyle", () => {
  it("returns red classes for 'critical'", () => {
    expect(styleToString(tagStyle("critical"))).toMatch(/red/);
  });
  it("returns red classes for 'blocked', 'blocker', 'urgent', 'hotfix', 'p0', 'must'", () => {
    for (const tag of ["blocked", "blocker", "urgent", "hotfix", "p0", "must"]) {
      expect(styleToString(tagStyle(tag))).toMatch(/red/);
    }
  });
  it("returns amber classes for 'warn', 'risk', 'caution', 'p1', 'todo', 'flag'", () => {
    for (const tag of ["warn", "risk", "caution", "p1", "todo", "flag"]) {
      expect(styleToString(tagStyle(tag))).toMatch(/amber/);
    }
  });
  it("returns green classes for 'validated', 'shipped', 'done', 'launch', 'live', 'won', 'pivot'", () => {
    for (const tag of ["validated", "shipped", "done", "launch", "live", "won", "pivot"]) {
      expect(styleToString(tagStyle(tag))).toMatch(/emerald/);
    }
  });
  it("returns sky classes for 'testing', 'experiment', 'running', 'wip'", () => {
    for (const tag of ["testing", "experiment", "running", "wip"]) {
      expect(styleToString(tagStyle(tag))).toMatch(/sky/);
    }
  });
  it("returns violet classes for 'idea', 'nice', 'later', 'backlog', 'maybe'", () => {
    for (const tag of ["idea", "nice", "later", "backlog", "maybe"]) {
      expect(styleToString(tagStyle(tag))).toMatch(/violet/);
    }
  });
  it("returns muted for an empty string", () => {
    expect(tagStyle("")).toEqual(TAG_STYLE_MUTED);
  });
  it("returns muted for an unknown tag", () => {
    expect(tagStyle("xyz")).toEqual(TAG_STYLE_MUTED);
  });
  it("matches case-insensitively", () => {
    expect(styleToString(tagStyle("BLOCKED"))).toMatch(/red/);
    expect(styleToString(tagStyle("Shipped"))).toMatch(/emerald/);
  });
  it("returns muted when input is null/undefined without throwing", () => {
    // Defensive: callers should always pass a string, but a null input
    // should fall to the muted branch rather than throw.
    expect(tagStyle(null as unknown as string)).toEqual(TAG_STYLE_MUTED);
    expect(tagStyle(undefined as unknown as string)).toEqual(TAG_STYLE_MUTED);
  });
  it("first match wins (priority order)", () => {
    // 'p0' is critical (red) — should be red even though '0' is not
    // a warning or anything else.
    expect(styleToString(tagStyle("p0"))).toMatch(/red/);
    // 'risk' is warning (amber), not 'idea' or 'backlog'.
    expect(styleToString(tagStyle("risk"))).toMatch(/amber/);
  });
  it("matches substrings (permissive matching)", () => {
    // 'my-p1-todo-list' contains 'p1' and 'todo' — the function
    // should pick the first match (amber) and not the muted fallback.
    expect(styleToString(tagStyle("my-p1-todo-list"))).toMatch(/amber/);
    // 'launched-v2' contains 'launch' — green.
    expect(styleToString(tagStyle("launched-v2"))).toMatch(/emerald/);
  });
});
