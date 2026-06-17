import { describe, expect, it } from "vitest";
import { parseInlineMarkdown } from "./inline-markdown";

describe("parseInlineMarkdown", () => {
  it("returns a single text segment for plain input", () => {
    const segs = parseInlineMarkdown("hello world");
    expect(segs).toEqual([{ type: "text", value: "hello world" }]);
  });

  it("parses **bold** segments", () => {
    const segs = parseInlineMarkdown("a **bold** word");
    expect(segs).toEqual([
      { type: "text", value: "a " },
      { type: "bold", value: "bold" },
      { type: "text", value: " word" },
    ]);
  });

  it("parses *italic* segments", () => {
    const segs = parseInlineMarkdown("an *italic* word");
    expect(segs).toEqual([
      { type: "text", value: "an " },
      { type: "italic", value: "italic" },
      { type: "text", value: " word" },
    ]);
  });

  it("parses code segments", () => {
    const segs = parseInlineMarkdown("use `code` here");
    expect(segs).toEqual([
      { type: "text", value: "use " },
      { type: "code", value: "code" },
      { type: "text", value: " here" },
    ]);
  });

  it("parses [text](https://url) links", () => {
    const segs = parseInlineMarkdown("see [docs](https://example.com)");
    expect(segs).toEqual([
      { type: "text", value: "see " },
      { type: "link", value: "docs", href: "https://example.com" },
    ]);
  });

  it("supports backslash escaping", () => {
    const segs = parseInlineMarkdown("not \\*bold\\* here");
    expect(segs).toEqual([{ type: "text", value: "not *bold* here" }]);
  });

  it("leaves unmatched markers as plain text", () => {
    const segs = parseInlineMarkdown("**unclosed bold");
    expect(segs).toEqual([{ type: "text", value: "**unclosed bold" }]);
  });

  it("emits raw href even for non-http links (component sanitizes rendering)", () => {
    const segs = parseInlineMarkdown("[click](javascript:alert(1))");
    expect(segs).toHaveLength(1);
    const seg = segs[0];
    if (seg.type !== "link") throw new Error("expected link segment");
    expect(seg.href).toBe("javascript:alert(1)");
  });
});
