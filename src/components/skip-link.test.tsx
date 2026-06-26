import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SkipLink } from "./skip-link";

describe("<SkipLink>", () => {
  it("renders an <a> element", () => {
    const html = renderToStaticMarkup(<SkipLink />);
    expect(html).toContain("<a");
    expect(html).toContain("</a>");
  });

  it("links to the #main-content anchor", () => {
    const html = renderToStaticMarkup(<SkipLink />);
    expect(html).toContain('href="#main-content"');
  });

  it("renders the visible text 'Skip to content'", () => {
    const html = renderToStaticMarkup(<SkipLink />);
    expect(html).toContain("Skip to content");
  });

  it("starts screen-reader-only (sr-only) by default", () => {
    const html = renderToStaticMarkup(<SkipLink />);
    expect(html).toContain("sr-only");
    expect(html).toContain("focus:not-sr-only");
  });

  it("becomes fixed-position when focused (focus:fixed)", () => {
    const html = renderToStaticMarkup(<SkipLink />);
    expect(html).toContain("focus:fixed");
  });

  it("uses the primary brand color when focused (focus:bg-primary)", () => {
    const html = renderToStaticMarkup(<SkipLink />);
    expect(html).toContain("focus:bg-primary");
  });

  it("includes a high z-index when focused so it sits above all overlays", () => {
    const html = renderToStaticMarkup(<SkipLink />);
    expect(html).toContain("focus:z-[100]");
  });

  it("includes a focus ring for keyboard visibility", () => {
    const html = renderToStaticMarkup(<SkipLink />);
    expect(html).toContain("focus:ring-2");
  });

  it("uses a safe-area-aware top position via inline style", () => {
    const html = renderToStaticMarkup(<SkipLink />);
    expect(html).toContain("env(safe-area-inset-top");
  });
});
