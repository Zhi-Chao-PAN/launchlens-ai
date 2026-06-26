import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EditableText } from "./editable-text";

describe("<EditableText>", () => {
  it("renders a <textarea> element", () => {
    const html = renderToStaticMarkup(<EditableText label="My label" value="hello" onCommit={() => {}} />);
    expect(html).toContain("<textarea");
    expect(html).toContain("</textarea>");
  });

  it("uses the supplied value as the textarea content", () => {
    const html = renderToStaticMarkup(<EditableText label="l" value="hello world" onCommit={() => {}} />);
    expect(html).toContain("hello world");
  });

  it("exposes the label as aria-label", () => {
    const html = renderToStaticMarkup(<EditableText label="Target users" value="" onCommit={() => {}} />);
    expect(html).toContain('aria-label="Target users"');
  });

  it("uses 3 rows by default", () => {
    const html = renderToStaticMarkup(<EditableText label="l" value="" onCommit={() => {}} />);
    // renderToStaticMarkup emits rows="3" as an attribute.
    expect(html).toContain('rows="3"');
  });

  it("uses the supplied row count", () => {
    const html = renderToStaticMarkup(<EditableText label="l" value="" rows={8} onCommit={() => {}} />);
    expect(html).toContain('rows="8"');
  });

  it("applies the resize-y utility class", () => {
    const html = renderToStaticMarkup(<EditableText label="l" value="" onCommit={() => {}} />);
    expect(html).toContain("resize-y");
  });

  it("does not invoke onCommit during render", () => {
    let called = 0;
    renderToStaticMarkup(<EditableText label="l" value="" onCommit={() => called++} />);
    expect(called).toBe(0);
  });
});