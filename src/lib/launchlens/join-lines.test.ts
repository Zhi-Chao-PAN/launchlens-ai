import { describe, expect, it } from "vitest";
import { joinLines } from "./join-lines";
import { splitLines } from "./split-lines";

describe("joinLines", () => {
  it("returns the empty string for an empty array", () => {
    expect(joinLines([])).toBe("");
  });

  it("joins items with a single LF", () => {
    expect(joinLines(["a", "b", "c"])).toBe("a\nb\nc");
  });

  it("preserves a single item unchanged", () => {
    expect(joinLines(["only"])).toBe("only");
  });

  it("preserves internal whitespace inside items (no trimming)", () => {
    expect(joinLines(["  padded  ", "  spaced  "])).toBe("  padded  \n  spaced  ");
  });

  it("accepts readonly input arrays", () => {
    const readonly: readonly string[] = ["x", "y"];
    expect(joinLines(readonly)).toBe("x\ny");
  });

  it("does not introduce a trailing newline after the last item", () => {
    expect(joinLines(["a", "b"]).endsWith("\n")).toBe(false);
  });

  it("does not add a leading newline before the first item", () => {
    expect(joinLines(["a", "b"]).startsWith("\n")).toBe(false);
  });

  it("preserves empty-string items (caller can include them, caller can filter via splitLines)", () => {
    // joinLines does not filter — it is the inverse of an array spread.
    expect(joinLines(["", "x", ""])).toBe("\nx\n");
  });

  it("round-trips with splitLines: splitLines(joinLines(x)) == x (after trim+filter)", () => {
    const original = ["alpha", "  beta  ", "gamma"];
    const round = splitLines(joinLines(original));
    // splitLines trims each line and drops blanks, so the canonical
    // form is trim+filter applied to the original.
    expect(round).toEqual(["alpha", "beta", "gamma"]);
  });

  it("round-trips a list with intentional blanks (they are dropped by splitLines)", () => {
    const original = ["keep", "", "  ", "also-keep"];
    const round = splitLines(joinLines(original));
    expect(round).toEqual(["keep", "also-keep"]);
  });
});
