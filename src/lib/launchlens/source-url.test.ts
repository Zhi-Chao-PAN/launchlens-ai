import { describe, expect, it } from "vitest";
import { extractSourceUrl, normalizeExternalHttpUrl } from "./source-url";

describe("extractSourceUrl", () => {
  it("returns null for null", () => {
    expect(extractSourceUrl(null)).toBeNull();
  });
  it("returns null for undefined", () => {
    expect(extractSourceUrl(undefined)).toBeNull();
  });
  it("returns null for an empty string", () => {
    expect(extractSourceUrl("")).toBeNull();
  });
  it("returns null for a whitespace-only string", () => {
    expect(extractSourceUrl("   \n\t  ")).toBeNull();
  });
  it("returns the URL verbatim when the whole string is a URL", () => {
    expect(extractSourceUrl("https://example.com/path")).toBe("https://example.com/path");
    expect(extractSourceUrl("http://example.com")).toBe("http://example.com");
  });
  it("trims surrounding whitespace before returning the URL", () => {
    expect(extractSourceUrl("  https://example.com  ")).toBe("https://example.com");
  });
  it("returns the URL with the path/query/fragment preserved", () => {
    expect(extractSourceUrl("https://example.com/path?x=1&y=2#z")).toBe(
      "https://example.com/path?x=1&y=2#z",
    );
  });
  it("extracts the first URL from prose", () => {
    expect(extractSourceUrl("Per G2 reviews (https://g2.com/foo) the tool is great")).toBe(
      "https://g2.com/foo)",
    );
  });
  it("returns null for prose without any URL", () => {
    expect(extractSourceUrl("Per the G2 reviews, the tool is great")).toBeNull();
  });
  it("is case-insensitive on the scheme", () => {
    expect(extractSourceUrl("HTTPS://example.com")).toBe("HTTPS://example.com");
    expect(extractSourceUrl("HtTp://example.com")).toBe("HtTp://example.com");
  });
  it("recognises ftp:// and other schemes only if they are NOT present", () => {
    // The function only knows http and https. An ftp:// string should
    // not be picked up — callers would not be able to render it as a
    // safe link anyway, and silently extracting the wrong scheme would
    // mislead the UI.
    expect(extractSourceUrl("ftp://example.com")).toBeNull();
  });
});

describe("normalizeExternalHttpUrl", () => {
  it("returns null for empty or missing values", () => {
    expect(normalizeExternalHttpUrl(null)).toBeNull();
    expect(normalizeExternalHttpUrl(undefined)).toBeNull();
    expect(normalizeExternalHttpUrl("  ")).toBeNull();
  });

  it("normalizes safe http and https URLs", () => {
    expect(normalizeExternalHttpUrl(" https://research.example/research/sess-1 ")).toBe(
      "https://research.example/research/sess-1",
    );
    expect(normalizeExternalHttpUrl("http://research.example/research/sess-1")).toBe(
      "http://research.example/research/sess-1",
    );
  });

  it("rejects script, non-http, and malformed URLs", () => {
    expect(normalizeExternalHttpUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeExternalHttpUrl("ftp://research.example/file")).toBeNull();
    expect(normalizeExternalHttpUrl("not a url")).toBeNull();
  });
});
