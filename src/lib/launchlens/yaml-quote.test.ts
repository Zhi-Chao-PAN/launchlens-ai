import { describe, expect, it } from "vitest";
import { yamlQuote } from "./yaml-quote";

describe("yamlQuote", () => {
  it("wraps a plain string in double quotes", () => {
    expect(yamlQuote("hello")).toBe("\"hello\"");
  });

  it("returns empty quoted for empty string", () => {
    expect(yamlQuote("")).toBe("\"\"");
  });

  it("escapes embedded double quotes", () => {
    expect(yamlQuote('say "hi"')).toBe("\"say \\\"hi\\\"\"");
  });

  it("escapes embedded backslashes", () => {
    expect(yamlQuote("a\\b")).toBe("\"a\\\\b\"");
  });

  it("escapes both backslashes and double quotes when both are present", () => {
    expect(yamlQuote("a\\b\"c")).toBe("\"a\\\\b\\\"c\"");
  });

  it("leaves apostrophes / single quotes unchanged", () => {
    expect(yamlQuote("it's fine")).toBe("\"it's fine\"");
  });

  it("leaves non-ASCII characters unchanged", () => {
    expect(yamlQuote("café")).toBe("\"café\"");
  });

  it("leaves spaces, tabs and other characters unchanged (within the minimal escape set)", () => {
    expect(yamlQuote("a b\tc")).toBe("\"a b\tc\"");
  });

  it("preserves multiple consecutive escapes", () => {
    expect(yamlQuote("\\\\\\\\")).toBe("\"\\\\\\\\\\\\\\\\\"");
  });

  it("is symmetric: the output is always wrapped in \"...\"", () => {
    for (const input of ["x", '"x"', "x\\y", "mix\"and\\both", ""]) {
      const out = yamlQuote(input);
      expect(out.startsWith("\"")).toBe(true);
      expect(out.endsWith("\"")).toBe(true);
    }
  });
});
