import { describe, expect, it } from "vitest";
import { pinnedFirst, pinnedFirstBy } from "./pinned-first";

describe("pinnedFirst", () => {
  it("puts pinned items before non-pinned", () => {
    const items = [
      { id: 1, pinned: false },
      { id: 2, pinned: true },
      { id: 3, pinned: false },
      { id: 4, pinned: true },
    ];
    const sorted = [...items].sort(pinnedFirst);
    expect(sorted.map((i) => i.id)).toEqual([2, 4, 1, 3]);
  });

  it("returns 0 for two items with the same pinned-ness", () => {
    expect(pinnedFirst({ pinned: true }, { pinned: true })).toBe(0);
    expect(pinnedFirst({ pinned: false }, { pinned: false })).toBe(0);
  });

  it("handles missing pinned (treated as false)", () => {
    // a is missing the field, b is pinned -> b should sort after a.
    const a = { id: 1 };
    const b = { id: 2, pinned: true };
    expect(pinnedFirst(a, b)).toBe(1);
  });

  it("treats truthy non-boolean pinned values as pinned", () => {
    // a has truthy pinned, b has falsy pinned -> a sorts before b.
    expect(pinnedFirst({ pinned: 1 }, { pinned: 0 })).toBe(-1);
    expect(pinnedFirst({ pinned: "yes" }, { pinned: "" })).toBe(-1);
  });
});

describe("pinnedFirstBy", () => {
  it("sorts by the named boolean property", () => {
    const items = [
      { id: 1, featured: false },
      { id: 2, featured: true },
      { id: 3, featured: false },
    ];
    const sorted = [...items].sort(pinnedFirstBy("featured"));
    expect(sorted.map((i) => i.id)).toEqual([2, 1, 3]);
  });

  it("handles a missing value for the key", () => {
    const a = { id: 1 };
    const b = { id: 2, featured: true };
    expect(pinnedFirstBy("featured")(a, b)).toBe(1);
  });
});