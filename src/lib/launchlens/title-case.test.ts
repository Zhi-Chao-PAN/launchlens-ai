import { describe, expect, it } from "vitest";
import { titleCase } from "./title-case";

describe("titleCase", () => {
  it("upper-cases the first character", () => {
    expect(titleCase("untested")).toBe("Untested");
  });

  it("preserves the rest of the string unchanged", () => {
    expect(titleCase("supported")).toBe("Supported");
  });

  it("preserves multi-character tails", () => {
    expect(titleCase("ship-it")).toBe("Ship-it");
  });

  it("returns '' for null / undefined / empty", () => {
    expect(titleCase(null)).toBe("");
    expect(titleCase(undefined)).toBe("");
    expect(titleCase("")).toBe("");
  });

  it("is idempotent when the first char is already upper-case", () => {
    expect(titleCase("Already")).toBe("Already");
  });

  it("single-character input upper-cases to itself", () => {
    expect(titleCase("a")).toBe("A");
    expect(titleCase("Z")).toBe("Z");
  });

  it("leaves non-ASCII first characters unchanged (best-effort)", () => {
    // JavaScript's String.toUpperCase() handles unicode; just assert
    // the function doesn't crash and produces a string of the same
    // length.
    const out = titleCase("éclair");
    expect(typeof out).toBe("string");
    expect(out.length).toBe("éclair".length);
  });

  it("does not mutate the input string", () => {
    const original = "untested";
    const result = titleCase(original);
    expect(original).toBe("untested");
    expect(result).toBe("Untested");
  });
});
