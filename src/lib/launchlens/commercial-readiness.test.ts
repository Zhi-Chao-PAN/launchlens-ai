import { describe, expect, it } from "vitest";

import {
  evaluateCommercialReadiness,
  type CommercialReadinessSnapshot,
} from "./commercial-readiness";

function snapshot(): CommercialReadinessSnapshot {
  return {
    packageJson: {
      scripts: {
        "verify:commercial-readiness":
          "tsx scripts/verify-commercial-readiness.ts",
        "verify:portfolio": "tsx scripts/verify-portfolio-package.ts",
        "verify:release-readiness":
          "tsx scripts/verify-release-readiness.ts",
        "verify:production-demo": "tsx scripts/verify-production-demo.ts",
        "release:cloud": "npm run verify:public-demo",
        "decision:history": "tsx scripts/decision-history.ts",
      },
    },
    files: [
      {
        path: "docs/COMMERCIAL_READINESS.md",
        content:
          "Current Boundary Commercial Readiness Tracks Reviewer Evidence Index Identity And Tenant Model Billing And Plan Limits docs/COMMERCIAL_ENTITLEMENTS.md docs/COMMERCIAL_BILLING.md src/lib/launchlens/commercial-entitlements.ts /api/commercial/entitlements /api/commercial/subscription /api/webhooks/stripe Onboarding And Activation Eval And Ops Visibility Security And Compliance Re-entry Acceptance Gate Non-goals https://launchlens-ai-two.vercel.app/readiness npm run verify:commercial-readiness npm run verify:production-demo npm run release:cloud npm run decision:history -- --window PROJECT_MATURITY.md docs/PORTFOLIO_CASE_STUDY.md docs/PRODUCTION_RUNBOOK.md",
      },
      {
        path: "docs/COMMERCIAL_ENTITLEMENTS.md",
        content:
          "LaunchLens AI Commercial Entitlements Active Preview Plan Plan Matrix Enforced Today Still Pending docs/COMMERCIAL_BILLING.md src/lib/launchlens/commercial-entitlements.ts src/lib/launchlens/commercial-subscription.ts src/app/api/commercial/entitlements/route.ts /api/commercial/entitlements LAUNCHLENS_COMMERCIAL_PLAN=free|solo|team npm run verify:commercial-readiness",
      },
      {
        path: "docs/COMMERCIAL_BILLING.md",
        content:
          "LaunchLens AI Commercial Billing Implemented Surface State And Entitlement Precedence Webhook Safety launchlens_commercial_subscriptions launchlens_billing_events /api/commercial/checkout /api/commercial/portal /api/webhooks/stripe STRIPE_WEBHOOK_SECRET npm run verify:commercial-readiness",
      },
      {
        path: "src/app/readiness/page.tsx",
        content:
          "Commercial/Productization readiness Reviewer Evidence Index Identity and tenant model Billing and plan limits Entitlement Contract Subscription billing /billing /api/commercial/entitlements /api/commercial/subscription Onboarding and activation Eval and ops visibility npm run verify:commercial-readiness docs/COMMERCIAL_READINESS.md",
      },
      {
        path: "src/app/billing/page.tsx",
        content: "CommercialBilling Billing - LaunchLens AI",
      },
      {
        path: "src/components/commercial-billing.tsx",
        content:
          "Subscription and plan access /api/commercial/subscription /api/commercial/checkout /api/commercial/portal",
      },
      {
        path: "src/app/api/commercial/entitlements/route.ts",
        content:
          "summarizePreviewCommercialEntitlement commercialPlanRows noStoreJson",
      },
      {
        path: "src/app/api/commercial/subscription/route.ts",
        content:
          "resolveCommercialEntitlementForOwnerHash safeSubscription noStoreJson",
      },
      {
        path: "src/app/api/commercial/checkout/route.ts",
        content:
          "createStripeCheckout ERROR_BILLING_SUBSCRIPTION_EXISTS",
      },
      {
        path: "src/app/api/commercial/portal/route.ts",
        content:
          "createStripePortal ERROR_BILLING_SUBSCRIPTION_MISSING",
      },
      {
        path: "src/lib/launchlens/error-codes.ts",
        content:
          "billing_subscription_exists billing_subscription_missing",
      },
      {
        path: "src/app/api/webhooks/stripe/route.ts",
        content:
          "constructStripeWebhookEvent applyCommercialSubscriptionEvent",
      },
      {
        path: "src/lib/launchlens/commercial-entitlements.ts",
        content:
          "DEFAULT_COMMERCIAL_PLAN_ID commercialPlanCatalog evaluateCommercialLimit commercial_plan_limit_reached",
      },
      {
        path: "src/lib/launchlens/commercial-entitlements.test.ts",
        content:
          "keeps the public preview on the Team entitlement by default returns a stable code when a plan limit would be exceeded",
      },
      {
        path: "src/lib/launchlens/commercial-subscription.ts",
        content:
          "STRIPE_SUBSCRIPTION_STATUSES resolveCommercialSubscriptionEntitlement graceUntilForPastDue",
      },
      {
        path: "src/lib/launchlens/commercial-subscription-store.ts",
        content:
          "applyCommercialSubscriptionEvent latest_event_created_at processing_status",
      },
      {
        path: "src/lib/launchlens/stripe-server.ts",
        content: "constructEvent subscription_data idempotencyKey",
      },
      {
        path: "scripts/migrate-cloud-db.ts",
        content:
          "launchlens_commercial_subscriptions launchlens_billing_events",
      },
      {
        path: "src/lib/launchlens/cloud-db-contract.ts",
        content:
          "launchlens_commercial_subscriptions launchlens_billing_events",
      },
      {
        path: "README.md",
        content:
          "docs/COMMERCIAL_READINESS.md docs/COMMERCIAL_ENTITLEMENTS.md docs/COMMERCIAL_BILLING.md /api/commercial/entitlements https://launchlens-ai-two.vercel.app/readiness verify:commercial-readiness",
      },
      {
        path: "docs/PORTFOLIO_CASE_STUDY.md",
        content:
          "docs/COMMERCIAL_READINESS.md https://launchlens-ai-two.vercel.app/readiness",
      },
      {
        path: "docs/DEMO_SCRIPT.md",
        content:
          "docs/COMMERCIAL_READINESS.md https://launchlens-ai-two.vercel.app/readiness",
      },
      {
        path: "PROJECT_MATURITY.md",
        content:
          "Commercial/Productization Readiness docs/COMMERCIAL_READINESS.md",
      },
      {
        path: "ROADMAP.md",
        content:
          "Phase 7: Commercial/Productization Readiness docs/COMMERCIAL_READINESS.md",
      },
      {
        path: "TASKS.md",
        content:
          "Commercial/Productization Readiness npm run verify:commercial-readiness",
      },
    ],
  };
}

describe("commercial readiness", () => {
  it("accepts the expected commercial readiness package shape", () => {
    expect(evaluateCommercialReadiness(snapshot())).toEqual([]);
  });

  it("requires the commercial readiness verifier script", () => {
    const input = snapshot();
    delete input.packageJson.scripts?.["verify:commercial-readiness"];

    expect(evaluateCommercialReadiness(input)).toContainEqual({
      path: "package.json",
      message:
        "Missing commercial readiness verifier: verify:commercial-readiness",
    });
  });

  it("requires the hosted readiness page to be linked from README", () => {
    const input = snapshot();
    const readme = input.files.find((file) => file.path === "README.md");

    if (readme) {
      readme.content = readme.content.replace(
        "https://launchlens-ai-two.vercel.app/readiness",
        "",
      );
    }

    expect(evaluateCommercialReadiness(input)).toContainEqual({
      path: "README.md",
      message:
        "Missing hosted readiness URL: https://launchlens-ai-two.vercel.app/readiness",
    });
  });

  it("requires the detailed commercial readiness document", () => {
    const input = snapshot();
    input.files = input.files.filter(
      (file) => file.path !== "docs/COMMERCIAL_READINESS.md",
    );

    expect(evaluateCommercialReadiness(input)).toContainEqual({
      path: "docs/COMMERCIAL_READINESS.md",
      message: "Missing required readiness file.",
    });
  });
});
