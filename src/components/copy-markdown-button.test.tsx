import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CopyMarkdownButton } from "./copy-markdown-button";
import type { LaunchLensWorkspace } from "@/lib/launchlens/types";

const FIXTURE = { landingPage: { headline: "Test Workspace" } } as unknown as LaunchLensWorkspace;

describe("<CopyMarkdownButton>", () => {
  it("renders a <button type='button'>", () => {
    const html = renderToStaticMarkup(<CopyMarkdownButton workspace={FIXTURE} />);
    expect(html).toContain("<button");
    expect(html).toContain('type="button"');
  });

  it("starts in the 'Copy Markdown' idle state", () => {
    const html = renderToStaticMarkup(<CopyMarkdownButton workspace={FIXTURE} />);
    expect(html).toContain("Copy Markdown");
    expect(html).not.toContain("Copied");
    expect(html).not.toContain("Downloaded");
  });

  it("uses the copy icon (lucide-copy) in the idle state", () => {
    const html = renderToStaticMarkup(<CopyMarkdownButton workspace={FIXTURE} />);
    expect(html).toContain("lucide-copy");
  });

  it("has the long aria-label that explains the Shift+click download path", () => {
    const html = renderToStaticMarkup(<CopyMarkdownButton workspace={FIXTURE} />);
    expect(html).toContain("aria-label=\"Copy workspace as Markdown (Shift+click to download as .md file)\"");
  });

  it("exposes aria-live='polite'", () => {
    const html = renderToStaticMarkup(<CopyMarkdownButton workspace={FIXTURE} />);
    expect(html).toContain('aria-live="polite"');
  });

  it("has a title tooltip mentioning Shift+click", () => {
    const html = renderToStaticMarkup(<CopyMarkdownButton workspace={FIXTURE} />);
    expect(html).toContain("Shift+click");
  });

  it("applies the supplied className", () => {
    const html = renderToStaticMarkup(<CopyMarkdownButton workspace={FIXTURE} className="custom-x" />);
    expect(html).toContain("custom-x");
  });

  it("uses the idle (not copied / not downloaded) border/bg classes", () => {
    const html = renderToStaticMarkup(<CopyMarkdownButton workspace={FIXTURE} />);
    expect(html).toContain("border-input");
    expect(html).toContain("bg-card");
  });

  it("does not show the 'Copied' checkmark label in the initial state", () => {
    const html = renderToStaticMarkup(<CopyMarkdownButton workspace={FIXTURE} />);
    expect(html).not.toContain("lucide-circle-check");
  });
});
