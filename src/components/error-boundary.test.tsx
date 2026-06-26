import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ErrorBoundary, default as DefaultErrorBoundary } from "./error-boundary";

describe("<ErrorBoundary>", () => {
  it("renders its children when no error has been caught", () => {
    const html = renderToStaticMarkup(
      <ErrorBoundary label="Test section">
        <p>child content</p>
      </ErrorBoundary>,
    );
    expect(html).toContain("child content");
    expect(html).not.toContain("encountered an error");
  });

  it("passes through multiple children when no error", () => {
    const html = renderToStaticMarkup(
      <ErrorBoundary label="Test">
        <span>first</span>
        <span>second</span>
      </ErrorBoundary>,
    );
    expect(html).toContain("first");
    expect(html).toContain("second");
  });

  it("renders the custom fallback (when no error) is irrelevant — children win", () => {
    const html = renderToStaticMarkup(
      <ErrorBoundary
        label="Test"
        fallback={() => <div>custom fallback</div>}
      >
        <p>children win</p>
      </ErrorBoundary>,
    );
    expect(html).toContain("children win");
    expect(html).not.toContain("custom fallback");
  });

  it("exports both a named and default export", () => {
    // The default export is a passthrough reference to the named one.
    expect(ErrorBoundary).toBeDefined();
    expect(DefaultErrorBoundary).toBeDefined();
    // The default re-export should reference the same class.
    expect(DefaultErrorBoundary).toBe(ErrorBoundary);
  });

  it("renders a <p> element when no error (child tag survives)", () => {
    const html = renderToStaticMarkup(
      <ErrorBoundary label="Test">
        <p className="probe">probe</p>
      </ErrorBoundary>,
    );
    expect(html).toContain("<p");
    expect(html).toContain("probe");
  });
});
