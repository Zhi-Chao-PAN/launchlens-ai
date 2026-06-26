import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DownloadMarkdownButton } from "./download-markdown-button";
import type { LaunchLensWorkspace } from "@/lib/launchlens/types";

const FIXTURE = { landingPage: { headline: "Test Workspace" } } as unknown as LaunchLensWorkspace;

describe("<DownloadMarkdownButton>", () => {
  it("renders a <button type='button'>", () => {
    const html = renderToStaticMarkup(<DownloadMarkdownButton workspace={FIXTURE} />);
    expect(html).toContain("<button");
    expect(html).toContain('type="button"');
  });

  it("starts in the 'Download .md' state (not yet downloaded)", () => {
    const html = renderToStaticMarkup(<DownloadMarkdownButton workspace={FIXTURE} />);
    expect(html).toContain("Download .md");
    expect(html).not.toContain("Downloaded");
  });

  it("uses the download icon (lucide-download) in the initial state", () => {
    const html = renderToStaticMarkup(<DownloadMarkdownButton workspace={FIXTURE} />);
    expect(html).toContain("lucide-download");
  });

  it("has aria-label='Download workspace as Markdown file' in the initial state", () => {
    const html = renderToStaticMarkup(<DownloadMarkdownButton workspace={FIXTURE} />);
    expect(html).toContain('aria-label="Download workspace as Markdown file"');
  });

  it("has a title tooltip explaining the file extension", () => {
    const html = renderToStaticMarkup(<DownloadMarkdownButton workspace={FIXTURE} />);
    expect(html).toContain('title="Download .md file"');
  });

  it("exposes aria-live='polite'", () => {
    const html = renderToStaticMarkup(<DownloadMarkdownButton workspace={FIXTURE} />);
    expect(html).toContain('aria-live="polite"');
  });

  it("applies the supplied className", () => {
    const html = renderToStaticMarkup(<DownloadMarkdownButton workspace={FIXTURE} className="custom-x" />);
    expect(html).toContain("custom-x");
  });

  it("uses the initial (not downloaded) border/bg classes", () => {
    const html = renderToStaticMarkup(<DownloadMarkdownButton workspace={FIXTURE} />);
    expect(html).toContain("border-input");
    expect(html).toContain("bg-card");
  });
});
