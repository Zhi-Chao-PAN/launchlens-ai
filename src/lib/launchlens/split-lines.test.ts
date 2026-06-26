import { describe, expect, it } from "vitest";
import { splitLines } from "./split-lines";

describe("splitLines", () => {
  it("returns an empty array for an empty string", () => {
    expect(splitLines("")).toEqual([]);
  });
  it("returns a single line for a string without newlines", () => {
    expect(splitLines("hello")).toEqual(["hello"]);
  });
  it("splits on LF", () => {
    expect(splitLines("a\nb\nc")).toEqual(["a", "b", "c"]);
  });
  it("splits on CRLF", () => {
    expect(splitLines("a\r\nb\r\nc")).toEqual(["a", "b", "c"]);
  });
  it("splits on CR alone", () => {
    expect(splitLines("a\rb\rc")).toEqual(["a", "b", "c"]);
  });
  it("trims each line", () => {
    expect(splitLines("  a  \n  b  ")).toEqual(["a", "b"]);
  });
  it("drops blank lines (collapsed double newlines)", () => {
    expect(splitLines("a\n\nb")).toEqual(["a", "b"]);
  });
  it("drops lines that are whitespace-only", () => {
    expect(splitLines("a\n   \n  \nb")).toEqual(["a", "b"]);
  });
  it("preserves the order", () => {
    expect(splitLines("c\nb\na")).toEqual(["c", "b", "a"]);
  });
  it("preserves internal whitespace", () => {
    expect(splitLines("  a  b  \n  c  d  ")).toEqual(["a  b", "c  d"]);
  });
  it("handles a single trailing newline", () => {
    expect(splitLines("a\n")).toEqual(["a"]);
  });
  it("handles a single leading newline", () => {
    expect(splitLines("\na")).toEqual(["a"]);
  });
  it("handles a mix of CRLF and LF", () => {
    expect(splitLines("a\r\nb\nc")).toEqual(["a", "b", "c"]);
  });
});
