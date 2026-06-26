import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Disclosure, DisclosureGroup } from "./disclosure";

describe("<Disclosure>", () => {
  it("renders the title inside a <button>", () => {
    const html = renderToStaticMarkup(<Disclosure title="FAQ one">body</Disclosure>);
    expect(html).toContain("FAQ one");
    expect(html).toContain("<button");
    expect(html).toContain('type="button"');
  });

  it("starts collapsed (aria-expanded=false) by default", () => {
    const html = renderToStaticMarkup(<Disclosure title="t">body</Disclosure>);
    expect(html).toContain('aria-expanded="false"');
  });

  it("starts expanded when defaultOpen=true", () => {
    const html = renderToStaticMarkup(<Disclosure title="t" defaultOpen>b</Disclosure>);
    expect(html).toContain('aria-expanded="true"');
  });

  it("renders the body inside the panel when expanded", () => {
    const html = renderToStaticMarkup(<Disclosure title="t" defaultOpen>visible-body</Disclosure>);
    expect(html).toContain("visible-body");
  });

  it("renders the panel region with role='region' and aria-labelledby", () => {
    const html = renderToStaticMarkup(<Disclosure title="t" defaultOpen>b</Disclosure>);
    expect(html).toContain('role="region"');
    expect(html).toContain("aria-labelledby=");
  });

  it("links the button to the panel via aria-controls", () => {
    const html = renderToStaticMarkup(<Disclosure title="t" defaultOpen>b</Disclosure>);
    expect(html).toContain("aria-controls=");
    // The id referenced by aria-controls should match the panel's id.
    const controlsMatch = html.match(/aria-controls="([^"]+)"/);
    expect(controlsMatch).not.toBeNull();
    const panelId = controlsMatch![1];
    expect(html).toContain('id="' + panelId + '"');
  });

  it("inert=true on the panel when collapsed (a11y hides content)", () => {
    const html = renderToStaticMarkup(<Disclosure title="t">body</Disclosure>);
    expect(html).toContain("inert");
  });

  it("uses grid-template-rows animation contract (0fr collapsed, 1fr expanded)", () => {
    const collapsed = renderToStaticMarkup(<Disclosure title="t">b</Disclosure>);
    expect(collapsed).toContain("grid-template-rows:0fr");
    const expanded = renderToStaticMarkup(<Disclosure title="t" defaultOpen>b</Disclosure>);
    expect(expanded).toContain("grid-template-rows:1fr");
  });

  it("rotates the chevron icon when expanded", () => {
    const collapsed = renderToStaticMarkup(<Disclosure title="t">b</Disclosure>);
    expect(collapsed).toContain("rotate(0deg)");
    const expanded = renderToStaticMarkup(<Disclosure title="t" defaultOpen>b</Disclosure>);
    expect(expanded).toContain("rotate(180deg)");
  });
});

describe("<DisclosureGroup>", () => {
  it("renders a wrapper div with the provided className", () => {
    const html = renderToStaticMarkup(
      <DisclosureGroup className="faq-grid">
        <Disclosure title="a">x</Disclosure>
      </DisclosureGroup>,
    );
    expect(html).toContain('class="faq-grid"');
  });

  it("renders the children inside the wrapper", () => {
    const html = renderToStaticMarkup(
      <DisclosureGroup>
        <Disclosure title="q1">a1</Disclosure>
        <Disclosure title="q2">a2</Disclosure>
      </DisclosureGroup>,
    );
    expect(html).toContain("q1");
    expect(html).toContain("q2");
    expect(html).toContain("a1");
    expect(html).toContain("a2");
  });

  it("works with a single child Disclosure", () => {
    const html = renderToStaticMarkup(
      <DisclosureGroup>
        <Disclosure title="only">only-body</Disclosure>
      </DisclosureGroup>,
    );
    expect(html).toContain("only");
    expect(html).toContain("only-body");
  });

  it("works with zero children (renders an empty wrapper)", () => {
    const html = renderToStaticMarkup(<DisclosureGroup>{null}</DisclosureGroup>);
    expect(html).toContain("<div");
  });
});
