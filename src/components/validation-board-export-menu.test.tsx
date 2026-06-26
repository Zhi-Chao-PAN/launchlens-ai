import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ValidationBoardExportMenu } from "./validation-board-export-menu";

const HANDLERS = {
  onToggle: () => {},
  onClose: () => {},
  onCopyMarkdown: () => {},
  onDownloadMarkdown: () => {},
  onDownloadJson: () => {},
};

describe("<ValidationBoardExportMenu>", () => {
  it("renders only the trigger while closed", () => {
    const html = renderToStaticMarkup(
      <ValidationBoardExportMenu {...HANDLERS} open={false} />,
    );

    expect(html).toContain("Export validation board");
    expect(html).not.toContain('role="menu"');
    expect(html).not.toContain("Download JSON");
  });

  it("renders the menu actions while open", () => {
    const html = renderToStaticMarkup(
      <ValidationBoardExportMenu {...HANDLERS} open />,
    );

    expect(html).toContain('role="menu"');
    expect(html).toContain("Copy Markdown");
    expect(html).toContain("Download Markdown");
    expect(html).toContain("Download JSON");
  });

  it("does not call action handlers during render", () => {
    const onToggle = vi.fn();
    const onClose = vi.fn();
    const onCopyMarkdown = vi.fn();
    const onDownloadMarkdown = vi.fn();
    const onDownloadJson = vi.fn();

    renderToStaticMarkup(
      <ValidationBoardExportMenu
        open
        onToggle={onToggle}
        onClose={onClose}
        onCopyMarkdown={onCopyMarkdown}
        onDownloadMarkdown={onDownloadMarkdown}
        onDownloadJson={onDownloadJson}
      />,
    );

    expect(onToggle).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(onCopyMarkdown).not.toHaveBeenCalled();
    expect(onDownloadMarkdown).not.toHaveBeenCalled();
    expect(onDownloadJson).not.toHaveBeenCalled();
  });
});
