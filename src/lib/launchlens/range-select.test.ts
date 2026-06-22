import { describe, it, expect } from "vitest";
import { rangeSelectAdd, toggleSingle, rangeSelectEvidence } from "./range-select";

describe("rangeSelectAdd", () => {
  const order = ["a", "b", "c", "d", "e"];

  it("with no anchor simply adds the target", () => {
    expect(Array.from(rangeSelectAdd(new Set(), order, null, "c"))).toEqual(["c"]);
  });

  it("selects forward range", () => {
    const result = rangeSelectAdd(new Set(["a"]), order, "a", "d");
    expect(Array.from(result).sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("selects backward range", () => {
    const result = rangeSelectAdd(new Set(["e"]), order, "e", "b");
    expect(Array.from(result).sort()).toEqual(["b", "c", "d", "e"]);
  });

  it("preserves existing out-of-range selection (additive only)", () => {
    const result = rangeSelectAdd(new Set(["a", "z"]), order, "a", "c");
    expect(Array.from(result).sort()).toEqual(["a", "b", "c", "z"]);
  });

  it("anchor missing from visible order falls back to single add", () => {
    const result = rangeSelectAdd(new Set(), order, "x", "c");
    expect(Array.from(result)).toEqual(["c"]);
  });

  it("single item range (anchor == target) is idempotent add", () => {
    const result = rangeSelectAdd(new Set(), order, "c", "c");
    expect(Array.from(result)).toEqual(["c"]);
  });
});

describe("toggleSingle", () => {
  it("adds id if absent", () => {
    expect(Array.from(toggleSingle(new Set(["a"]), "b"))).toEqual(["a", "b"]);
  });
  it("removes id if present", () => {
    expect(Array.from(toggleSingle(new Set(["a", "b"]), "b"))).toEqual(["a"]);
  });
});

describe("rangeSelectEvidence", () => {
  const order = ["e1", "e2", "e3", "e4"];

  it("adds range within same experiment", () => {
    const result = rangeSelectEvidence({}, "exp1", order, { expId: "exp1", evId: "e1" }, "e3");
    expect(Array.from(result.exp1)).toEqual(["e1", "e2", "e3"]);
  });

  it("different experiment anchor falls back to single add in target experiment", () => {
    const result = rangeSelectEvidence(
      { exp2: new Set(["z"]) },
      "exp1",
      order,
      { expId: "exp2", evId: "z" },
      "e2",
    );
    expect(Array.from(result.exp1)).toEqual(["e2"]);
    expect(Array.from(result.exp2)).toEqual(["z"]);
  });

  it("null anchor falls back to single add", () => {
    const result = rangeSelectEvidence({}, "exp1", order, null, "e4");
    expect(Array.from(result.exp1)).toEqual(["e4"]);
  });
});
