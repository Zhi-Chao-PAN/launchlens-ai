import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Star } from "lucide-react";
import { Bullets } from "./bullets";

describe("<Bullets>", () => {
  it("renders an empty list when items is empty", () => {
    const html = renderToStaticMarkup(<Bullets items={[]} />);
    expect(html).toContain("<ul");
    expect(html).toContain("space-y-3");
  });

  it("renders one li per item (after cleanBullets filtering)", () => {
    const html = renderToStaticMarkup(
      <Bullets items={["a", "b", "c"]} />,
    );
    const lis = html.match(/<li/g) ?? [];
    expect(lis.length).toBe(3);
  });

  it("filters out empty / whitespace / '-' items", () => {
    const html = renderToStaticMarkup(
      <Bullets items={["a", "", "  ", "-", "b"]} />,
    );
    const lis = html.match(/<li/g) ?? [];
    expect(lis.length).toBe(2);
  });

  it("dedupes near-identical entries", () => {
    const html = renderToStaticMarkup(
      <Bullets items={["a", "  a  ", "b"]} />,
    );
    const lis = html.match(/<li/g) ?? [];
    expect(lis.length).toBe(2);
  });

  it("respects the max cap", () => {
    const html = renderToStaticMarkup(
      <Bullets items={["a", "b", "c", "d", "e"]} max={2} />,
    );
    const lis = html.match(/<li/g) ?? [];
    expect(lis.length).toBe(2);
  });

  it("dedupes identical items via cleanBullets (single <li> for three identical inputs)", () => {
    // The cleanBullets helper de-duplicates by trimmed text, so
    // three identical items collapse to one <li>. The list is keyed
    // by position; the dedup happens at the array level, not the
    // key level.
    const html = renderToStaticMarkup(<Bullets items={["x", "x", "x"]} />);
    const lis = html.match(/<li/g) ?? [];
    expect(lis.length).toBe(1);
  });

  it("honors ariaLabel on the outer <ul>", () => {
    const html = renderToStaticMarkup(
      <Bullets items={["a"]} ariaLabel="Proof points" />,
    );
    expect(html).toContain('aria-label="Proof points"');
  });

  it("uses the default icon when no icon prop is passed", () => {
    const html = renderToStaticMarkup(<Bullets items={["a"]} />);
    // lucide-react CheckCircle2 renders as <svg class="lucide lucide-circle-check">
    expect(html).toContain("lucide-circle-check");
  });

  it("uses a custom icon when passed", () => {
    const html = renderToStaticMarkup(
      <Bullets items={["a"]} icon={Star} iconClassName="text-amber-500" />,
    );
    expect(html).toContain("lucide-star");
    expect(html).toContain("text-amber-500");
  });

  it("applies itemClassName to every li", () => {
    const html = renderToStaticMarkup(
      <Bullets items={["a", "b"]} itemClassName="font-bold" />,
    );
    expect(html.match(/class="[^"]*font-bold/g)?.length).toBe(2);
  });

  it("renders the item text in a <span>", () => {
    const html = renderToStaticMarkup(<Bullets items={["hello world"]} />);
    expect(html).toContain("<span>hello world</span>");
  });
});
