import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SystemStatus } from "./system-status";

describe("<SystemStatus>", () => {
  it("renders a <button> as the trigger", () => {
    const html = renderToStaticMarkup(<SystemStatus />);
    expect(html).toContain("<button");
    expect(html).toContain('type="button"');
  });

  it("uses 'System status' as the aria-label", () => {
    const html = renderToStaticMarkup(<SystemStatus />);
    expect(html).toContain('aria-label="System status"');
  });

  it("starts with the dropdown closed (aria-expanded=false)", () => {
    const html = renderToStaticMarkup(<SystemStatus />);
    expect(html).toContain('aria-expanded="false"');
  });

  it("does not render the dialog before the user opens it", () => {
    const html = renderToStaticMarkup(<SystemStatus />);
    expect(html).not.toContain('role="dialog"');
  });

  it("shows the loading-state label before the first fetch resolves", () => {
    const html = renderToStaticMarkup(<SystemStatus />);
    // isOpen=false, so the label is hidden via 'hidden sm:inline', but
    // the text node is still in the DOM.
    expect(html).toContain("Checking...");
  });

  it("shows a status role for screen-reader announcements", () => {
    const html = renderToStaticMarkup(<SystemStatus />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });

  it("renders the loader icon while fetching (animate-spin class)", () => {
    const html = renderToStaticMarkup(<SystemStatus />);
    expect(html).toContain("animate-spin");
  });

  it("includes focus-visible styling for keyboard navigation", () => {
    const html = renderToStaticMarkup(<SystemStatus />);
    expect(html).toContain("focus-visible:outline-none");
    expect(html).toContain("focus-visible:ring-2");
  });
});
