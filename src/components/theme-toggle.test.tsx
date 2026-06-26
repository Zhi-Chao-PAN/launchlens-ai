import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ThemeToggle } from "./theme-toggle";

describe("<ThemeToggle>", () => {
  it("renders the SSR placeholder before mount (avoids layout shift)", () => {
    const html = renderToStaticMarkup(<ThemeToggle />);
    // The useTheme hook returns mounted=false on the first render, so
    // the placeholder branch fires: a button with aria-hidden=true and
    // tabIndex=-1 that occupies the same space as the real button.
    expect(html).toContain("<button");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('tabindex="-1"');
  });

  it("placeholder keeps the same fixed size as the real toggle (h-9 w-9 sm:h-8 sm:w-8)", () => {
    const html = renderToStaticMarkup(<ThemeToggle />);
    expect(html).toContain("h-9 w-9");
    expect(html).toContain("sm:h-8 sm:w-8");
  });

  it("placeholder uses opacity-0 so the button takes space without being visible", () => {
    const html = renderToStaticMarkup(<ThemeToggle />);
    expect(html).toContain("opacity-0");
  });

  it("placeholder still renders an icon (Sun) so SSR is fully populated", () => {
    const html = renderToStaticMarkup(<ThemeToggle />);
    expect(html).toContain("lucide-sun");
  });

  it("placeholder does not render aria-label (hidden from assistive tech)", () => {
    const html = renderToStaticMarkup(<ThemeToggle />);
    expect(html).not.toContain("aria-label=");
  });
});
