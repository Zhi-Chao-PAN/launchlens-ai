import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Skeleton, SkeletonCard, SkeletonText } from "./skeleton";

describe("<Skeleton>", () => {
  it("renders a div with role='status' and aria-label='Loading'", () => {
    const html = renderToStaticMarkup(<Skeleton />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Loading"');
  });

  it("applies rounded-none when rounded='none'", () => {
    expect(renderToStaticMarkup(<Skeleton rounded="none" />)).toContain("rounded-none");
  });

  it("applies rounded-sm when rounded='sm'", () => {
    expect(renderToStaticMarkup(<Skeleton rounded="sm" />)).toContain("rounded-sm");
  });

  it("applies rounded-md by default", () => {
    expect(renderToStaticMarkup(<Skeleton />)).toContain("rounded-md");
  });

  it("applies rounded-lg when rounded='lg'", () => {
    expect(renderToStaticMarkup(<Skeleton rounded="lg" />)).toContain("rounded-lg");
  });

  it("applies rounded-full when rounded='full'", () => {
    expect(renderToStaticMarkup(<Skeleton rounded="full" />)).toContain("rounded-full");
  });

  it("uses animate-pulse in the non-shimmer variant", () => {
    expect(renderToStaticMarkup(<Skeleton />)).toContain("animate-pulse");
  });

  it("uses the shimmer overlay markup in the shimmer variant", () => {
    const html = renderToStaticMarkup(<Skeleton shimmer />);
    expect(html).toContain("animate-[launchlens-shimmer_1.4s_ease-in-out_infinite]");
    expect(html).toContain("via-white/70");
    expect(html).not.toContain("animate-pulse");
  });

  it("includes the extra className when provided", () => {
    expect(renderToStaticMarkup(<Skeleton className="h-10 w-20" />)).toContain("h-10 w-20");
  });
});

describe("<SkeletonCard>", () => {
  it("renders a title bar by default", () => {
    const html = renderToStaticMarkup(<SkeletonCard />);
    expect(html).toContain("h-5");
    expect(html).toContain("w-1/3");
  });

  it("omits the title bar when title={false}", () => {
    const html = renderToStaticMarkup(<SkeletonCard title={false} />);
    expect(html).not.toContain("mb-3");
  });

  it("renders 3 lines by default", () => {
    const html = renderToStaticMarkup(<SkeletonCard />);
    // Each line sets an inline style="width:N%". Three lines means three
    // width: declarations inside the body section (the title bar has no
    // inline width).
    const matches = html.match(/style="width:\d+%"/g) || [];
    expect(matches.length).toBe(3);
  });

  it("renders the requested number of lines", () => {
    const html = renderToStaticMarkup(<SkeletonCard lines={5} />);
    const matches = html.match(/style="width:\d+%"/g) || [];
    // 5 lines + 1 title bar = 6 Skeletons, each with a style width.
    expect(matches.length).toBeGreaterThanOrEqual(5);
  });
});

describe("<SkeletonText>", () => {
  it("omits the heading bar when heading={false}", () => {
    const html = renderToStaticMarkup(<SkeletonText heading={false} />);
    expect(html).not.toContain("mb-2");
  });

  it("renders the heading bar when heading={true}", () => {
    const html = renderToStaticMarkup(<SkeletonText heading={true} />);
    expect(html).toContain("mb-2");
  });

  it("renders 3 lines by default", () => {
    const html = renderToStaticMarkup(<SkeletonText />);
    // Each <Skeleton> inside renders one div with role="status".
    const matches = html.match(/role="status"/g) || [];
    expect(matches.length).toBe(3);
  });
});
