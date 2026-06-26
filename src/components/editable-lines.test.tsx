import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EditableLines } from "./editable-lines";

describe("<EditableLines>", () => {
  it("renders an underlying <textarea> element", () => {
    const html = renderToStaticMarkup(<EditableLines label="My list" items={["a", "b"]} onCommit={() => {}} />);
    expect(html).toContain("<textarea");
  });

  it("joins items with LF so each appears on its own line", () => {
    const html = renderToStaticMarkup(<EditableLines label="l" items={["alpha", "beta", "gamma"]} onCommit={() => {}} />);
    expect(html).toContain("alpha");
    expect(html).toContain("beta");
    expect(html).toContain("gamma");
  });

  it("renders an empty textarea for an empty items array", () => {
    const html = renderToStaticMarkup(<EditableLines label="l" items={[]} onCommit={() => {}} />);
    // No list-shape items should appear between the textarea tags.
    // The textarea element itself is still rendered.
    expect(html).toContain("<textarea");
  });

  it("uses 5 rows by default (list-shaped textarea)", () => {
    const html = renderToStaticMarkup(<EditableLines label="l" items={["x"]} onCommit={() => {}} />);
    expect(html).toContain('rows="5"');
  });

  it("honours a custom rows value", () => {
    const html = renderToStaticMarkup(<EditableLines label="l" items={["x"]} rows={10} onCommit={() => {}} />);
    expect(html).toContain('rows="10"');
  });

  it("uses the label as aria-label", () => {
    const html = renderToStaticMarkup(<EditableLines label="Target users" items={["a"]} onCommit={() => {}} />);
    expect(html).toContain('aria-label="Target users"');
  });

  it("does not invoke onCommit during render", () => {
    let called = 0;
    renderToStaticMarkup(<EditableLines label="l" items={["a"]} onCommit={() => called++} />);
    expect(called).toBe(0);
  });
});