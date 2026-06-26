import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ValidationBoardFilterBar } from "./validation-board-filter-bar";

const BASE_PROPS = {
  experimentCount: 5,
  activeCount: 3,
  decidedCount: 2,
  statusFilter: "active" as const,
  sortBy: "confidence" as const,
  tags: ["pricing", "onboarding"],
  tagFilter: "pricing",
  searchQuery: "export",
  onStatusFilterChange: () => {},
  onTagFilterChange: () => {},
  onSearchQueryChange: () => {},
  onSortByChange: () => {},
};

describe("<ValidationBoardFilterBar>", () => {
  it("renders status counts, tags, search, and sort controls", () => {
    const html = renderToStaticMarkup(
      <ValidationBoardFilterBar {...BASE_PROPS} />,
    );

    expect(html).toContain("All");
    expect(html).toContain("(5)");
    expect(html).toContain("Active");
    expect(html).toContain("(3)");
    expect(html).toContain("Decided");
    expect(html).toContain("(2)");
    expect(html).toContain("#pricing");
    expect(html).toContain("#onboarding");
    expect(html).toContain('value="export"');
    expect(html).toContain("Highest confidence");
  });

  it("does not render tag controls when there are no tags", () => {
    const html = renderToStaticMarkup(
      <ValidationBoardFilterBar {...BASE_PROPS} tags={[]} tagFilter={null} />,
    );

    expect(html).not.toContain("Tags:");
    expect(html).not.toContain("#pricing");
  });

  it("does not call handlers while rendering", () => {
    const onStatusFilterChange = vi.fn();
    const onTagFilterChange = vi.fn();
    const onSearchQueryChange = vi.fn();
    const onSortByChange = vi.fn();

    renderToStaticMarkup(
      <ValidationBoardFilterBar
        {...BASE_PROPS}
        onStatusFilterChange={onStatusFilterChange}
        onTagFilterChange={onTagFilterChange}
        onSearchQueryChange={onSearchQueryChange}
        onSortByChange={onSortByChange}
      />,
    );

    expect(onStatusFilterChange).not.toHaveBeenCalled();
    expect(onTagFilterChange).not.toHaveBeenCalled();
    expect(onSearchQueryChange).not.toHaveBeenCalled();
    expect(onSortByChange).not.toHaveBeenCalled();
  });
});
