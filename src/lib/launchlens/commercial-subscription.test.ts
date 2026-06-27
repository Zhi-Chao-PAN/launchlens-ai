import { describe, expect, it, vi, afterEach } from "vitest";

import {
  STRIPE_SUBSCRIPTION_STATUSES,
  canStartCommercialCheckout,
  graceUntilForPastDue,
  resolveCommercialSubscriptionEntitlement,
} from "./commercial-subscription";

describe("commercial subscription domain", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("only starts checkout without a subscription or after terminal setup states", () => {
    expect(canStartCommercialCheckout()).toBe(true);
    expect(canStartCommercialCheckout("canceled")).toBe(true);
    expect(canStartCommercialCheckout("incomplete_expired")).toBe(true);
    expect(canStartCommercialCheckout("incomplete")).toBe(false);
    expect(canStartCommercialCheckout("past_due")).toBe(false);
    expect(canStartCommercialCheckout("unpaid")).toBe(false);
    expect(canStartCommercialCheckout("paused")).toBe(false);
    expect(canStartCommercialCheckout("active")).toBe(false);
  });

  describe("STRIPE_SUBSCRIPTION_STATUSES", () => {
    it("exposes every Stripe subscription status the resolver understands", () => {
      expect(STRIPE_SUBSCRIPTION_STATUSES).toEqual([
        "incomplete",
        "incomplete_expired",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "paused",
      ]);
    });
  });

  describe("resolveCommercialSubscriptionEntitlement", () => {
    it("falls back to the preview plan when no subscription is persisted", () => {
      const resolved = resolveCommercialSubscriptionEntitlement({
        now: new Date("2026-06-15T12:00:00.000Z"),
        previewPlanId: "solo",
      });

      expect(resolved.access).toBe("preview");
      expect(resolved.planId).toBe("solo");
      expect(resolved.source).toBe("preview");
    });

    it("keeps the preview plan on Free when the caller asks for it explicitly", () => {
      const resolved = resolveCommercialSubscriptionEntitlement({
        now: new Date("2026-06-15T12:00:00.000Z"),
        previewPlanId: "free",
      });

      expect(resolved.access).toBe("preview");
      expect(resolved.planId).toBe("free");
      expect(resolved.source).toBe("preview");
    });

    it("preserves the persisted Solo plan when the subscription is active", () => {
      const resolved = resolveCommercialSubscriptionEntitlement({
        now: new Date("2026-06-15T12:00:00.000Z"),
        previewPlanId: "team",
        persistedSubscription: {
          status: "active",
          planId: "solo",
        },
      });

      expect(resolved.access).toBe("full");
      expect(resolved.planId).toBe("solo");
      expect(resolved.source).toBe("subscription");
    });

    it("preserves the persisted Team plan when the subscription is trialing", () => {
      const resolved = resolveCommercialSubscriptionEntitlement({
        now: new Date("2026-06-15T12:00:00.000Z"),
        previewPlanId: "solo",
        persistedSubscription: {
          status: "trialing",
          planId: "team",
        },
      });

      expect(resolved.access).toBe("full");
      expect(resolved.planId).toBe("team");
      expect(resolved.source).toBe("subscription");
    });

    it("honors past_due within the grace window with restricted access", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00.000Z"));

      const resolved = resolveCommercialSubscriptionEntitlement({
        previewPlanId: "solo",
        persistedSubscription: {
          status: "past_due",
          planId: "team",
          graceUntil: new Date("2026-06-22T12:00:00.000Z"),
        },
      });

      expect(resolved.access).toBe("grace");
      expect(resolved.planId).toBe("team");
      expect(resolved.source).toBe("subscription");
    });

    it("resolves past_due to Free after the grace deadline has passed", () => {
      const resolved = resolveCommercialSubscriptionEntitlement({
        now: new Date("2026-06-23T12:00:00.000Z"),
        previewPlanId: "solo",
        persistedSubscription: {
          status: "past_due",
          planId: "team",
          graceUntil: new Date("2026-06-22T12:00:00.000Z"),
        },
      });

      expect(resolved.access).toBe("restricted");
      expect(resolved.planId).toBe("free");
      expect(resolved.source).toBe("subscription");
    });

    it.each([
      "canceled",
      "unpaid",
      "paused",
      "incomplete",
      "incomplete_expired",
    ] as const)(
      "falls back to Free when the subscription status is %s",
      (status) => {
        const resolved = resolveCommercialSubscriptionEntitlement({
          now: new Date("2026-06-15T12:00:00.000Z"),
          previewPlanId: "team",
          persistedSubscription: {
            status,
            planId: "solo",
          },
        });

        expect(resolved.access).toBe("restricted");
        expect(resolved.planId).toBe("free");
        expect(resolved.source).toBe("subscription");
      },
    );

    it("prefers the persisted subscription over the supplied preview plan", () => {
      const resolved = resolveCommercialSubscriptionEntitlement({
        now: new Date("2026-06-15T12:00:00.000Z"),
        previewPlanId: "solo",
        persistedSubscription: {
          status: "active",
          planId: "team",
        },
      });

      expect(resolved.planId).toBe("team");
      expect(resolved.source).toBe("subscription");
    });
  });

  describe("graceUntilForPastDue", () => {
    it("uses a sensible default grace window when no deadline is supplied", () => {
      const now = new Date("2026-06-15T12:00:00.000Z");
      const eventCreatedAt = new Date("2026-06-14T12:00:00.000Z");

      const grace = graceUntilForPastDue(eventCreatedAt);

      expect(grace.getTime()).toBeGreaterThan(now.getTime());
    });

    it("retains an existing grace deadline instead of extending it", () => {
      const eventCreatedAt = new Date("2026-06-21T12:00:00.000Z");
      const existing = new Date("2026-06-25T12:00:00.000Z");

      const grace = graceUntilForPastDue(eventCreatedAt, existing);

      expect(grace.getTime()).toBe(existing.getTime());
    });

    it("starts a seven-day grace window at the event timestamp", () => {
      const eventCreatedAt = new Date("2026-06-14T12:00:00.000Z");

      const grace = graceUntilForPastDue(eventCreatedAt);

      expect(grace.getTime()).toBe(
        eventCreatedAt.getTime() + 7 * 24 * 60 * 60 * 1000,
      );
    });
  });
});
