import { describe, expect, it } from "vitest";

import {
  commercialPlanIdForStripePrice,
  stripeBillingReadiness,
  stripePriceIdForPlan,
} from "./stripe-billing";

// Placeholder identifiers only; never real Stripe credentials or price ids.
const PLACEHOLDER_SECRET = "sk_test_placeholder_value";
const PLACEHOLDER_WEBHOOK = "whsec_placeholder_value";
const PLACEHOLDER_SOLO_PRICE = "price_placeholder_solo";
const PLACEHOLDER_TEAM_PRICE = "price_placeholder_team";

function makeReadyEnv() {
  return {
    STRIPE_SECRET_KEY: PLACEHOLDER_SECRET,
    STRIPE_WEBHOOK_SECRET: PLACEHOLDER_WEBHOOK,
    STRIPE_PRICE_SOLO: PLACEHOLDER_SOLO_PRICE,
    STRIPE_PRICE_TEAM: PLACEHOLDER_TEAM_PRICE,
  };
}

describe("stripe billing configuration seam", () => {
  describe("stripeBillingReadiness", () => {
    it("disables checkout when the secret key is missing", () => {
      const env = {
        ...makeReadyEnv(),
        STRIPE_SECRET_KEY: undefined,
      };

      const readiness = stripeBillingReadiness(env);

      expect(readiness.checkoutEnabled).toBe(false);
      expect(readiness.missing).toContain("STRIPE_SECRET_KEY");
    });

    it("disables checkout when the webhook secret is missing", () => {
      const env = {
        ...makeReadyEnv(),
        STRIPE_WEBHOOK_SECRET: undefined,
      };

      const readiness = stripeBillingReadiness(env);

      expect(readiness.checkoutEnabled).toBe(false);
      expect(readiness.missing).toContain("STRIPE_WEBHOOK_SECRET");
    });

    it("disables checkout when the solo price id is missing", () => {
      const env = {
        ...makeReadyEnv(),
        STRIPE_PRICE_SOLO: undefined,
      };

      const readiness = stripeBillingReadiness(env);

      expect(readiness.checkoutEnabled).toBe(false);
      expect(readiness.missing).toContain("STRIPE_PRICE_SOLO");
    });

    it("disables checkout when the team price id is missing", () => {
      const env = {
        ...makeReadyEnv(),
        STRIPE_PRICE_TEAM: undefined,
      };

      const readiness = stripeBillingReadiness(env);

      expect(readiness.checkoutEnabled).toBe(false);
      expect(readiness.missing).toContain("STRIPE_PRICE_TEAM");
    });

    it("lists every missing field at once when multiple are absent", () => {
      const readiness = stripeBillingReadiness({});

      expect(readiness.checkoutEnabled).toBe(false);
      expect(readiness.missing).toEqual(
        expect.arrayContaining([
          "STRIPE_SECRET_KEY",
          "STRIPE_WEBHOOK_SECRET",
          "STRIPE_PRICE_SOLO",
          "STRIPE_PRICE_TEAM",
        ]),
      );
    });

    it("treats blank strings as missing configuration", () => {
      const env = {
        STRIPE_SECRET_KEY: "  ",
        STRIPE_WEBHOOK_SECRET: "",
        STRIPE_PRICE_SOLO: PLACEHOLDER_SOLO_PRICE,
        STRIPE_PRICE_TEAM: PLACEHOLDER_TEAM_PRICE,
      };

      const readiness = stripeBillingReadiness(env);

      expect(readiness.checkoutEnabled).toBe(false);
      expect(readiness.missing).toEqual(
        expect.arrayContaining(["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]),
      );
    });

    it("enables checkout when secret, webhook, and both price ids are set", () => {
      const readiness = stripeBillingReadiness(makeReadyEnv());

      expect(readiness.checkoutEnabled).toBe(true);
      expect(readiness.missing).toEqual([]);
    });
  });

  describe("stripePriceIdForPlan", () => {
    it("returns the solo price id when configured", () => {
      expect(stripePriceIdForPlan("solo", makeReadyEnv())).toBe(
        PLACEHOLDER_SOLO_PRICE,
      );
    });

    it("returns the team price id when configured", () => {
      expect(stripePriceIdForPlan("team", makeReadyEnv())).toBe(
        PLACEHOLDER_TEAM_PRICE,
      );
    });

    it("returns null for the free plan (it is not billable)", () => {
      expect(stripePriceIdForPlan("free", makeReadyEnv())).toBeNull();
    });

    it("returns null when the requested plan price id is not configured", () => {
      const env = {
        STRIPE_SECRET_KEY: PLACEHOLDER_SECRET,
        STRIPE_WEBHOOK_SECRET: PLACEHOLDER_WEBHOOK,
        STRIPE_PRICE_SOLO: PLACEHOLDER_SOLO_PRICE,
      };

      expect(stripePriceIdForPlan("team", env)).toBeNull();
    });

    it("returns null for unknown plan ids", () => {
      expect(
        stripePriceIdForPlan(
          "enterprise" as unknown as Parameters<typeof stripePriceIdForPlan>[0],
          makeReadyEnv(),
        ),
      ).toBeNull();
    });
  });

  describe("commercialPlanIdForStripePrice", () => {
    it("maps the solo price id back to the solo plan", () => {
      expect(
        commercialPlanIdForStripePrice(PLACEHOLDER_SOLO_PRICE, makeReadyEnv()),
      ).toBe("solo");
    });

    it("maps the team price id back to the team plan", () => {
      expect(
        commercialPlanIdForStripePrice(PLACEHOLDER_TEAM_PRICE, makeReadyEnv()),
      ).toBe("team");
    });

    it("returns null when the price id is not configured", () => {
      expect(
        commercialPlanIdForStripePrice(
          "price_unconfigured_placeholder",
          makeReadyEnv(),
        ),
      ).toBeNull();
    });

    it("returns null when neither price id is configured", () => {
      expect(
        commercialPlanIdForStripePrice(PLACEHOLDER_SOLO_PRICE, {}),
      ).toBeNull();
    });

    it("returns null for an empty price id", () => {
      expect(commercialPlanIdForStripePrice("", makeReadyEnv())).toBeNull();
    });
  });
});
