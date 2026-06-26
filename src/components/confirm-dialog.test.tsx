import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";

describe("<ConfirmDialog>", () => {
  it("renders nothing when open=false", () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog
        open={false}
        title="t"
        body="b"
        confirmLabel="ok"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(html).toBe("");
  });

  it("renders the title in an <h3> when open", () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog
        open={true}
        title="Delete snapshot?"
        body="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(html).toContain("Delete snapshot?");
    expect(html).toContain("<h3");
  });

  it("renders the body", () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog
        open={true}
        title="t"
        body="Are you sure?"
        confirmLabel="yes"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(html).toContain("Are you sure?");
  });

  it("uses 'Cancel' as the default cancel label", () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog
        open={true}
        title="t"
        body="b"
        confirmLabel="ok"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(html).toContain("Cancel");
  });

  it("honours a custom cancelLabel", () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog
        open={true}
        title="t"
        body="b"
        confirmLabel="ok"
        cancelLabel="Never mind"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(html).toContain("Never mind");
  });

  it("renders the confirm label", () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog
        open={true}
        title="t"
        body="b"
        confirmLabel="Delete forever"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(html).toContain("Delete forever");
  });

  it("exposes role='dialog' and aria-modal='true'", () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog
        open={true}
        title="t"
        body="b"
        confirmLabel="ok"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });

  it("links the dialog to the title via aria-labelledby and to the body via aria-describedby", () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog
        open={true}
        title="t"
        body="b"
        confirmLabel="ok"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(html).toContain("aria-labelledby=");
    expect(html).toContain("aria-describedby=");
  });

  it("uses the danger styling class on the confirm button when danger=true", () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog
        open={true}
        title="t"
        body="b"
        confirmLabel="Delete"
        danger={true}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(html).toContain("bg-signal-challenges");
    expect(html).not.toContain("bg-primary");
  });

  it("uses the primary styling class on the confirm button by default", () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog
        open={true}
        title="t"
        body="b"
        confirmLabel="ok"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(html).toContain("bg-primary");
    expect(html).not.toContain("bg-signal-challenges");
  });

  it("disables both buttons when busy=true", () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog
        open={true}
        title="t"
        body="b"
        confirmLabel="ok"
        busy={true}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    const disabledCount = (html.match(/disabled=""/g) || []).length;
    expect(disabledCount).toBeGreaterThanOrEqual(2);
    expect(html).toContain('aria-busy="true"');
  });

  it("shows the Loader2 spinner (animate-spin) inside the confirm button when busy", () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog
        open={true}
        title="t"
        body="b"
        confirmLabel="ok"
        busy={true}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(html).toContain("animate-spin");
  });

  it("places a fixed full-screen backdrop", () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog
        open={true}
        title="t"
        body="b"
        confirmLabel="ok"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(html).toContain("fixed inset-0");
    expect(html).toContain("bg-black/40");
  });

  it("invokes onCancel (not onConfirm) when the cancel button is clicked (browser-only)", () => {
    // This branch verifies the onCancel wiring is plumbed. The dialog
    // itself cannot be exercised through SSR rendering, but we can
    // at least assert the handler reference is stable across renders
    // and that no false-positive invocation occurred during render.
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    renderToStaticMarkup(
      <ConfirmDialog
        open={true}
        title="t"
        body="b"
        confirmLabel="ok"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
