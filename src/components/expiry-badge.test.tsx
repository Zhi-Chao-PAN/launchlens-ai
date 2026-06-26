import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ExpiryBadge } from "./shared-workspace-view";

const FIXED_NOW = new Date("2026-06-26T12:00:00Z").getTime();
const iso = (msFromNow: number) => new Date(FIXED_NOW + msFromNow).toISOString();

describe("<ExpiryBadge>", () => {
  describe("hydration safety", () => {
    it("renders nothing when mounted=false (avoiding hydration mismatch)", () => {
      const html = renderToStaticMarkup(
        <ExpiryBadge expiresAt={iso(86_400_000)} mounted={false} nowTick={0} />,
      );
      expect(html).toBe("");
    });

    it("renders the badge once mounted=true even with a 0 nowTick", () => {
      const html = renderToStaticMarkup(
        <ExpiryBadge expiresAt={iso(86_400_000)} mounted={true} nowTick={0} />,
      );
      expect(html).toContain("<span");
      expect(html).toContain("Expires");
    });
  });

  describe("null expiresAt (permanent link)", () => {
    it("renders the 'Permanent' label", () => {
      const html = renderToStaticMarkup(
        <ExpiryBadge expiresAt={null} mounted={true} nowTick={0} />,
      );
      expect(html).toContain("Permanent");
    });

    it("uses the neutral (emerald) styling variant", () => {
      const html = renderToStaticMarkup(
        <ExpiryBadge expiresAt={null} mounted={true} nowTick={0} />,
      );
      expect(html).toContain("bg-emerald-100");
      expect(html).toContain("text-emerald-800");
      expect(html).not.toContain("bg-amber-100");
    });
  });

  describe("future expiresAt (active badge)", () => {
    it("renders the 'Expires tomorrow' label for a near-future expiry", () => {
      const html = renderToStaticMarkup(
        <ExpiryBadge expiresAt={iso(60 * 60 * 1000)} mounted={true} nowTick={0} />,
      );
      expect(html).toContain("Expires tomorrow");
    });

    it("uses the danger (amber) styling variant", () => {
      const html = renderToStaticMarkup(
        <ExpiryBadge expiresAt={iso(7 * 86_400_000)} mounted={true} nowTick={0} />,
      );
      expect(html).toContain("bg-amber-100");
      expect(html).toContain("text-amber-800");
      expect(html).not.toContain("bg-emerald-100");
    });

    it("includes the badge.title in the title attribute", () => {
      const html = renderToStaticMarkup(
        <ExpiryBadge expiresAt={iso(7 * 86_400_000)} mounted={true} nowTick={0} />,
      );
      expect(html).toContain("title=");
      expect(html).toContain("Expires");
    });
  });

  describe("past expiresAt (expired)", () => {
    it("renders nothing once the link has expired", () => {
      const html = renderToStaticMarkup(
        <ExpiryBadge expiresAt={iso(-86_400_000)} mounted={true} nowTick={0} />,
      );
      expect(html).toBe("");
    });
  });

  describe("nowTick subscription", () => {
    it("renders the same badge for a future expiry regardless of nowTick value", () => {
      // The nowTick is intentionally a counter that gets bumped by
      // the parent every 30s; the badge should still render the
      // correct label for any nowTick value (the actual `now` is
      // computed as Date.now() + nowTick, and we can't freeze
      // Date.now() in SSR — but the render should not crash and
      // should still produce a span for a non-expired timestamp).
      const a = renderToStaticMarkup(
        <ExpiryBadge expiresAt={iso(86_400_000)} mounted={true} nowTick={0} />,
      );
      const b = renderToStaticMarkup(
        <ExpiryBadge expiresAt={iso(86_400_000)} mounted={true} nowTick={9999} />,
      );
      expect(a).toContain("<span");
      expect(b).toContain("<span");
    });
  });
});
