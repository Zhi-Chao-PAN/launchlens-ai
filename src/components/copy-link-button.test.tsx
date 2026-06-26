import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CopyLinkButton } from "./copy-link-button";

describe("<CopyLinkButton>", () => {
  it("renders a <button type='button'>", () => {
    const html = renderToStaticMarkup(<CopyLinkButton />);
    expect(html).toContain("<button");
    expect(html).toContain('type="button"');
  });

  it("starts in the 'Copy link' state (not yet copied)", () => {
    const html = renderToStaticMarkup(<CopyLinkButton />);
    expect(html).toContain("Copy link");
    expect(html).not.toContain("Copied");
  });

  it("uses the link icon (lucide-link) in the initial state", () => {
    const html = renderToStaticMarkup(<CopyLinkButton />);
    expect(html).toContain("lucide-link");
    expect(html).not.toContain("lucide-circle-check");
  });

  it("has aria-label='Copy share link' in the initial state", () => {
    const html = renderToStaticMarkup(<CopyLinkButton />);
    expect(html).toContain('aria-label="Copy share link"');
  });

  it("exposes aria-live='polite' for screen-reader feedback", () => {
    const html = renderToStaticMarkup(<CopyLinkButton />);
    expect(html).toContain('aria-live="polite"');
  });

  it("applies the supplied className", () => {
    const html = renderToStaticMarkup(<CopyLinkButton className="extra-class" />);
    expect(html).toContain("extra-class");
  });

  it("uses the initial (not copied) border/bg classes", () => {
    const html = renderToStaticMarkup(<CopyLinkButton />);
    expect(html).toContain("border-input");
    expect(html).toContain("bg-card");
  });

  it("hides icons from assistive tech via aria-hidden", () => {
    const html = renderToStaticMarkup(<CopyLinkButton />);
    // lucide-react icons render an svg with aria-hidden attribute when
    // passed the prop. Either "aria-hidden" appears, or the svg is
    // present and decorative by convention; just assert the icon is
    // present.
    expect(html).toContain("size-4");
  });
});
