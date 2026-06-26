import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ValidationEmptyStates } from "./validation-empty-states";

const BASE_PROPS = {
  activeCount: 0,
  archivedCount: 0,
  hasActiveFilters: false,
  onClearFilters: () => {},
  onShowArchived: () => {},
  onAddHypothesis: () => {},
};

describe("<ValidationEmptyStates>", () => {
  it("renders nothing when active hypotheses exist", () => {
    const html = renderToStaticMarkup(
      <ValidationEmptyStates {...BASE_PROPS} activeCount={1} />,
    );
    expect(html).toBe("");
  });

  it("renders the filtered empty state", () => {
    const html = renderToStaticMarkup(
      <ValidationEmptyStates {...BASE_PROPS} hasActiveFilters />,
    );
    expect(html).toContain("No hypotheses match your current filters");
    expect(html).toContain("Clear all filters");
  });

  it("renders the archived-only empty state", () => {
    const html = renderToStaticMarkup(
      <ValidationEmptyStates {...BASE_PROPS} archivedCount={3} />,
    );
    expect(html).toContain("All your hypotheses are archived");
    expect(html).toContain("Show archived (3)");
    expect(html).toContain("New hypothesis");
  });

  it("renders the first-hypothesis empty state", () => {
    const html = renderToStaticMarkup(<ValidationEmptyStates {...BASE_PROPS} />);
    expect(html).toContain("Map out your first validation hypotheses");
    expect(html).toContain("Add your first hypothesis");
  });

  it("does not call handlers while rendering", () => {
    const onClearFilters = vi.fn();
    const onShowArchived = vi.fn();
    const onAddHypothesis = vi.fn();

    renderToStaticMarkup(
      <ValidationEmptyStates
        {...BASE_PROPS}
        onClearFilters={onClearFilters}
        onShowArchived={onShowArchived}
        onAddHypothesis={onAddHypothesis}
      />,
    );

    expect(onClearFilters).not.toHaveBeenCalled();
    expect(onShowArchived).not.toHaveBeenCalled();
    expect(onAddHypothesis).not.toHaveBeenCalled();
  });
});
