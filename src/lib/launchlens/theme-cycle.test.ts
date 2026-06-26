import { describe, expect, it } from "vitest";
import { nextTheme, THEME_CYCLE } from "./theme-cycle";

describe("THEME_CYCLE", () => {
  it("is the documented cycle: light -> dark -> system -> light", () => {
    expect(THEME_CYCLE).toEqual(["light", "dark", "system"]);
  });
});

describe("nextTheme", () => {
  it("advances 'light' to 'dark'", () => {
    expect(nextTheme("light")).toBe("dark");
  });

  it("advances 'dark' to 'system'", () => {
    expect(nextTheme("dark")).toBe("system");
  });

  it("advances 'system' to 'light' (wraps around)", () => {
    expect(nextTheme("system")).toBe("light");
  });

  it("returns 'light' for unknown values", () => {
    expect(nextTheme("purple")).toBe("light");
    expect(nextTheme("")).toBe("light");
  });

  it("is a permutation: applying nextTheme three times returns the input", () => {
    for (const start of THEME_CYCLE) {
      const once = nextTheme(start);
      const twice = nextTheme(once);
      const thrice = nextTheme(twice);
      expect(thrice).toBe(start);
    }
  });
});
