import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EmptyState, NoDataIcon, SearchIcon, SparkleIcon } from "./empty-state";

describe("<EmptyState>", () => {
  it("renders the title in an <h3>", () => {
    const html = renderToStaticMarkup(<EmptyState title="Nothing here" />);
    expect(html).toContain("Nothing here");
    expect(html).toContain("<h3");
  });

  it("applies the size='sm' py class", () => {
    const html = renderToStaticMarkup(<EmptyState title="t" size="sm" />);
    expect(html).toContain("py-6");
  });

  it("applies the size='md' py class by default", () => {
    const html = renderToStaticMarkup(<EmptyState title="t" />);
    expect(html).toContain("py-12");
  });

  it("applies the size='lg' py class", () => {
    const html = renderToStaticMarkup(<EmptyState title="t" size="lg" />);
    expect(html).toContain("py-20");
  });

  it("renders description only when provided", () => {
    const without = renderToStaticMarkup(<EmptyState title="t" />);
    expect(without).not.toContain("<p");
    const withDesc = renderToStaticMarkup(
      <EmptyState title="t" description="explains" />,
    );
    expect(withDesc).toContain("explains");
    expect(withDesc).toContain("<p");
  });

  it("renders icon only when provided", () => {
    const without = renderToStaticMarkup(<EmptyState title="t" />);
    expect(without).not.toContain("<svg");
    const withIcon = renderToStaticMarkup(
      <EmptyState title="t" icon={<NoDataIcon />} />,
    );
    expect(withIcon).toContain("<svg");
  });

  it("renders action only when provided", () => {
    const without = renderToStaticMarkup(<EmptyState title="t" />);
    expect(without).not.toContain("mt-4");
    const withAction = renderToStaticMarkup(
      <EmptyState title="t" action={<button>go</button>} />,
    );
    expect(withAction).toContain("mt-4");
    expect(withAction).toContain("<button");
  });

  it("exposes role='status' and an aria-label for screen readers", () => {
    const html = renderToStaticMarkup(<EmptyState title="t" />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Empty state"');
  });

  it("centers content (text-center + flex-col items-center)", () => {
    const html = renderToStaticMarkup(<EmptyState title="t" />);
    expect(html).toContain("text-center");
    expect(html).toContain("flex-col");
    expect(html).toContain("items-center");
  });
});

describe("EmptyState built-in icons", () => {
  it("NoDataIcon renders an <svg>", () => {
    expect(renderToStaticMarkup(<NoDataIcon />)).toContain("<svg");
  });

  it("SparkleIcon renders an <svg>", () => {
    expect(renderToStaticMarkup(<SparkleIcon />)).toContain("<svg");
  });

  it("SearchIcon renders an <svg>", () => {
    expect(renderToStaticMarkup(<SearchIcon />)).toContain("<svg");
  });

  it("NoDataIcon, SparkleIcon and SearchIcon are all distinct SVGs", () => {
    const noData = renderToStaticMarkup(<NoDataIcon />);
    const sparkle = renderToStaticMarkup(<SparkleIcon />);
    const search = renderToStaticMarkup(<SearchIcon />);
    expect(noData).not.toBe(sparkle);
    expect(noData).not.toBe(search);
    expect(sparkle).not.toBe(search);
  });
});
