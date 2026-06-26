import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ValidationBulkActionsToolbar } from "./validation-bulk-actions-toolbar";

const BASE_PROPS = {
  batchCount: 3,
  batchTagInput: "",
  batchTagMode: null,
  allWorkspaceTags: [
    { tag: "pricing", count: 2 },
    { tag: "onboarding", count: 1 },
  ],
  selectedTags: {
    union: new Set(["pricing"]),
    intersection: new Set(["pricing"]),
  },
  isBatchBriefing: false,
  batchBriefProgress: { done: 0, total: 0 },
  onSelectAll: () => {},
  onSetStatus: () => {},
  onBatchTagModeChange: () => {},
  onBatchTagInputChange: () => {},
  onApplyBatchTagInput: () => {},
  onBatchAddTag: () => {},
  onBatchRemoveTag: () => {},
  onGenerateBriefs: () => {},
  onArchive: () => {},
  onDelete: () => {},
  onClear: () => {},
};

describe("<ValidationBulkActionsToolbar>", () => {
  it("renders nothing when no hypotheses are selected", () => {
    const html = renderToStaticMarkup(
      <ValidationBulkActionsToolbar {...BASE_PROPS} batchCount={0} />,
    );

    expect(html).toBe("");
  });

  it("renders bulk status and destructive actions", () => {
    const html = renderToStaticMarkup(
      <ValidationBulkActionsToolbar {...BASE_PROPS} />,
    );

    expect(html).toContain("3 selected");
    expect(html).toContain("Mark untested");
    expect(html).toContain("Mark supported");
    expect(html).toContain("Archive");
    expect(html).toContain("Delete");
  });

  it("renders add-tag suggestions excluding tags on every selected hypothesis", () => {
    const html = renderToStaticMarkup(
      <ValidationBulkActionsToolbar {...BASE_PROPS} batchTagMode="add" />,
    );

    expect(html).toContain("onboarding");
    expect(html).not.toContain('>pricing</button>');
    expect(html).toContain("new or existing tag");
  });

  it("renders remove-tag suggestions from selected hypotheses", () => {
    const html = renderToStaticMarkup(
      <ValidationBulkActionsToolbar {...BASE_PROPS} batchTagMode="remove" />,
    );

    expect(html).toContain("pricing");
    expect(html).toContain("tag to remove");
  });

  it("renders decision brief progress while briefing is running", () => {
    const html = renderToStaticMarkup(
      <ValidationBulkActionsToolbar
        {...BASE_PROPS}
        isBatchBriefing
        batchBriefProgress={{ done: 2, total: 3 }}
      />,
    );

    expect(html).toContain("2/3");
    expect(html).not.toContain(">Briefs</button>");
  });

  it("does not call handlers while rendering", () => {
    const handlers = {
      onSelectAll: vi.fn(),
      onSetStatus: vi.fn(),
      onBatchTagModeChange: vi.fn(),
      onBatchTagInputChange: vi.fn(),
      onApplyBatchTagInput: vi.fn(),
      onBatchAddTag: vi.fn(),
      onBatchRemoveTag: vi.fn(),
      onGenerateBriefs: vi.fn(),
      onArchive: vi.fn(),
      onDelete: vi.fn(),
      onClear: vi.fn(),
    };

    renderToStaticMarkup(
      <ValidationBulkActionsToolbar
        {...BASE_PROPS}
        {...handlers}
        batchTagMode="add"
      />,
    );

    for (const handler of Object.values(handlers)) {
      expect(handler).not.toHaveBeenCalled();
    }
  });
});
