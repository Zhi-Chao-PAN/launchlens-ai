import {
  isCommercialPlanId,
  type CommercialPlanId,
} from "./commercial-entitlements";

export type StripeBillingEnv = Record<string, string | undefined>;

export type StripeBillingReadiness = {
  enabled: boolean;
  checkoutEnabled: boolean;
  webhookEnabled: boolean;
  portalEnabled: boolean;
  missing: string[];
  billablePlans: CommercialPlanId[];
};

const REQUIRED_STRIPE_ENV = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_SOLO",
  "STRIPE_PRICE_TEAM",
] as const;

const STRIPE_PRICE_ENV: Record<"solo" | "team", string> = {
  solo: "STRIPE_PRICE_SOLO",
  team: "STRIPE_PRICE_TEAM",
};

function configuredValue(env: StripeBillingEnv, key: string) {
  const value = env[key]?.trim();
  return value ? value : null;
}

export function stripeBillingReadiness(
  env: StripeBillingEnv,
): StripeBillingReadiness {
  const missing = REQUIRED_STRIPE_ENV.filter(
    (key) => configuredValue(env, key) === null,
  );
  const enabled = missing.length === 0;

  return {
    enabled,
    checkoutEnabled: enabled,
    webhookEnabled:
      configuredValue(env, "STRIPE_SECRET_KEY") !== null &&
      configuredValue(env, "STRIPE_WEBHOOK_SECRET") !== null,
    portalEnabled: configuredValue(env, "STRIPE_SECRET_KEY") !== null,
    missing,
    billablePlans: (["solo", "team"] as const).filter(
      (planId) => stripePriceIdForPlan(planId, env) !== null,
    ),
  };
}

export function stripePriceIdForPlan(
  planId: unknown,
  env: StripeBillingEnv,
): string | null {
  if (!isCommercialPlanId(planId) || planId === "free") {
    return null;
  }

  return configuredValue(env, STRIPE_PRICE_ENV[planId]);
}

export function commercialPlanIdForStripePrice(
  priceId: unknown,
  env: StripeBillingEnv,
): CommercialPlanId | null {
  if (typeof priceId !== "string" || priceId.length === 0) {
    return null;
  }

  for (const planId of ["solo", "team"] as const) {
    if (stripePriceIdForPlan(planId, env) === priceId) {
      return planId;
    }
  }

  return null;
}

export function isBillableCommercialPlan(
  value: unknown,
): value is "solo" | "team" {
  return value === "solo" || value === "team";
}

export function stripeAppBaseUrl(
  requestUrl: string,
  env: StripeBillingEnv,
): string | null {
  const explicitUrl = configuredValue(env, "NEXT_PUBLIC_APP_URL");
  const vercelProductionHost = configuredValue(
    env,
    "VERCEL_PROJECT_PRODUCTION_URL",
  );
  const candidate =
    explicitUrl ??
    (vercelProductionHost ? `https://${vercelProductionHost}` : requestUrl);

  try {
    const url = new URL(candidate);
    const isLocalHttp =
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1");

    if (url.protocol !== "https:" && !isLocalHttp) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}
