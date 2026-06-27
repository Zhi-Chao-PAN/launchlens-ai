import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FilterChip } from "./filter-chip";

const BASE = {
  label: "Supports",
  count: 3,
  onClick: () => {},
  title: "Supports: this evidence reinforces the hypothesis.",
  ariaLabelPrefix: "Filter evidence by signal",
  ariaValue: "supports",
};

describe("<FilterChip>", () => {
  it("renders a <button type='button'>", () => {
    const html = renderToStaticMarkup(<FilterChip {...BASE} active={false} />);
    expect(html).toContain("<button");
    expect(html).toContain('type="button"');
  });

  it("renders the label and count together in parentheses", () => {
    const html = renderToStaticMarkup(<FilterChip {...BASE} active={false} />);
    expect(html).toContain("Supports (3)");
  });

  it("renders the count correctly for a 1-item case (singular 'item' in aria-label)", () => {
    const html = renderToStaticMarkup(<FilterChip {...BASE} count={1} active={false} />);
    expect(html).toContain("Supports (1)");
    expect(html).toContain("1 item.");
  });

  it("renders the count correctly for an N-item case (plural 'items' in aria-label)", () => {
    const html = renderToStaticMarkup(<FilterChip {...BASE} count={5} active={false} />);
    expect(html).toContain("Supports (5)");
    expect(html).toContain("5 items.");
  });

  it("builds the aria-label from the prefix, value, and count", () => {
    const html = renderToStaticMarkup(<FilterChip {...BASE} active={false} />);
    expect(html).toContain('aria-label="Filter evidence by signal: supports. 3 items."');
  });

  it("sets aria-pressed=true when active", () => {
    const html = renderToStaticMarkup(<FilterChip {...BASE} active={true} />);
    expect(html).toContain('aria-pressed="true"');
  });

  it("sets aria-pressed=false when inactive", () => {
    const html = renderToStaticMarkup(<FilterChip {...BASE} active={false} />);
    expect(html).toContain('aria-pressed="false"');
  });

  it("appends '(currently active)' to the title when active", () => {
    const active = renderToStaticMarkup(<FilterChip {...BASE} active={true} />);
    expect(active).toContain("(currently active)");
    const idle = renderToStaticMarkup(<FilterChip {...BASE} active={false} />);
    expect(idle).not.toContain("(currently active)");
  });

  it("uses the filled variant active class by default (bg-accent text-primary-text)", () => {
    const html = renderToStaticMarkup(<FilterChip {...BASE} active={true} />);
    expect(html).toContain("bg-accent");
    expect(html).toContain("text-primary-text");
  });

  it("uses the ringed variant active class (ring-1 ring-accent) when variant='ringed'", () => {
    const html = renderToStaticMarkup(<FilterChip {...BASE} active={true} variant="ringed" />);
    expect(html).toContain("ring-1");
    expect(html).toContain("ring-accent");
    // Filled variant should not appear.
    expect(html).not.toContain("text-primary-text");
  });

  it("uses the filled idle class (bg-card text-muted) by default", () => {
    const html = renderToStaticMarkup(<FilterChip {...BASE} active={false} />);
    expect(html).toContain("bg-card");
    expect(html).toContain("text-muted");
  });

  it("uses the ringed idle class (bg-transparent) when variant='ringed' and inactive", () => {
    const html = renderToStaticMarkup(<FilterChip {...BASE} active={false} variant="ringed" />);
    expect(html).toContain("bg-transparent");
  });

  it("applies the shared base classes to both variants", () => {
    const filled = renderToStaticMarkup(<FilterChip {...BASE} active={false} />);
    const ringed = renderToStaticMarkup(<FilterChip {...BASE} active={false} variant="ringed" />);
    expect(filled).toContain("rounded-full");
    expect(ringed).toContain("rounded-full");
    expect(filled).toContain("px-2 py-0.5");
    expect(ringed).toContain("px-2 py-0.5");
  });

  it("does not invoke onClick during render (handler reference is stable)", () => {
    const onClick = vi.fn();
    renderToStaticMarkup(<FilterChip {...BASE} onClick={onClick} active={false} />);
    expect(onClick).not.toHaveBeenCalled();
  });
});
