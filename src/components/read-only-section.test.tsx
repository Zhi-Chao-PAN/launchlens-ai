import { renderToStaticMarkup } from "react-dom/server";
import { Sparkles } from "lucide-react";
import { describe, expect, it } from "vitest";
import { ReadOnlySection } from "./shared-workspace-view";

describe("<ReadOnlySection>", () => {
  describe("non-collapsible mode (default)", () => {
    it("renders a <section> wrapping the children", () => {
      const html = renderToStaticMarkup(
        <ReadOnlySection title="My title" icon={Sparkles}>body</ReadOnlySection>,
      );
      expect(html).toContain("<section");
      expect(html).toContain("body");
    });

    it("renders the title in an <h2>", () => {
      const html = renderToStaticMarkup(
        <ReadOnlySection title="Quick check" icon={Sparkles}>x</ReadOnlySection>,
      );
      expect(html).toContain("Quick check");
      expect(html).toContain("<h2");
    });

    it("does NOT render a <button> when not collapsible", () => {
      const html = renderToStaticMarkup(
        <ReadOnlySection title="t" icon={Sparkles}>x</ReadOnlySection>,
      );
      // No chevron-toggle button when collapsible=false.
      expect(html).not.toContain("aria-expanded");
    });

    it("always renders the children inline (no collapse state to apply)", () => {
      const html = renderToStaticMarkup(
        <ReadOnlySection title="t" icon={Sparkles}>always-visible</ReadOnlySection>,
      );
      expect(html).toContain("always-visible");
    });
  });

  describe("collapsible mode", () => {
    it("renders a <button> as the title bar when collapsible=true", () => {
      const html = renderToStaticMarkup(
        <ReadOnlySection title="FAQ" icon={Sparkles} collapsible>x</ReadOnlySection>,
      );
      expect(html).toContain("<button");
      expect(html).toContain('type="button"');
    });

    it("starts expanded (aria-expanded=true)", () => {
      const html = renderToStaticMarkup(
        <ReadOnlySection title="t" icon={Sparkles} collapsible>x</ReadOnlySection>,
      );
      expect(html).toContain('aria-expanded="true"');
    });

    it("rotates the chevron 180° when expanded", () => {
      const html = renderToStaticMarkup(
        <ReadOnlySection title="t" icon={Sparkles} collapsible>x</ReadOnlySection>,
      );
      expect(html).toContain("rotate-180");
    });

    it("links the button to the content panel via aria-controls", () => {
      const html = renderToStaticMarkup(
        <ReadOnlySection title="t" icon={Sparkles} collapsible sectionId="sec-1">x</ReadOnlySection>,
      );
      expect(html).toContain("aria-controls=");
      const controlsMatch = html.match(/aria-controls="([^"]+)"/);
      expect(controlsMatch).not.toBeNull();
      expect(html).toContain('id="' + controlsMatch![1] + '"');
    });

    it("uses default section id (undefined) for aria-controls when sectionId is not provided", () => {
      const html = renderToStaticMarkup(
        <ReadOnlySection title="t" icon={Sparkles} collapsible>x</ReadOnlySection>,
      );
      // Button is still present, aria-controls may be undefined.
      expect(html).toContain("<button");
    });
  });

  describe("section id wiring", () => {
    it("uses the sectionId on the <section> and the heading", () => {
      const html = renderToStaticMarkup(
        <ReadOnlySection title="t" icon={Sparkles} sectionId="my-section">x</ReadOnlySection>,
      );
      expect(html).toContain('id="my-section"');
      expect(html).toContain('id="my-section-heading"');
    });

    it("aria-labelledby on the section points at the heading", () => {
      const html = renderToStaticMarkup(
        <ReadOnlySection title="t" icon={Sparkles} sectionId="my-section">x</ReadOnlySection>,
      );
      expect(html).toContain('aria-labelledby="my-section-heading"');
    });

    it("omits the sectionId wiring when sectionId is undefined", () => {
      const html = renderToStaticMarkup(
        <ReadOnlySection title="t" icon={Sparkles}>x</ReadOnlySection>,
      );
      expect(html).not.toContain("aria-labelledby=");
    });

    it("renders tabIndex=-1 only on the 'validation-decisions' section", () => {
      const focused = renderToStaticMarkup(
        <ReadOnlySection title="t" icon={Sparkles} sectionId="validation-decisions">x</ReadOnlySection>,
      );
      expect(focused).toContain('tabindex="-1"');
      const unfocused = renderToStaticMarkup(
        <ReadOnlySection title="t" icon={Sparkles} sectionId="other">x</ReadOnlySection>,
      );
      expect(unfocused).not.toContain("tabindex=");
    });
  });

  describe("icon rendering", () => {
    it("renders the lucide icon (size-3.5 sm:size-4)", () => {
      const html = renderToStaticMarkup(
        <ReadOnlySection title="t" icon={Sparkles}>x</ReadOnlySection>,
      );
      // lucide-react renders the icon as an svg with the merged className.
      expect(html).toContain("lucide-sparkles");
      expect(html).toContain("size-3.5");
    });
  });
});
