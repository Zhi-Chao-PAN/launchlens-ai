export type CommercialReadinessFile = {
  path: string;
  content: string;
};

export type CommercialReadinessSnapshot = {
  packageJson: {
    scripts?: Record<string, string>;
  };
  files: CommercialReadinessFile[];
};

export type CommercialReadinessIssue = {
  path: string;
  message: string;
};

type RequiredText = {
  value: string;
  label: string;
};

const requiredScripts: RequiredText[] = [
  {
    value: "verify:commercial-readiness",
    label: "commercial readiness verifier",
  },
  { value: "verify:portfolio", label: "portfolio package verifier" },
  {
    value: "verify:release-readiness",
    label: "release readiness verifier",
  },
  { value: "verify:production-demo", label: "production demo verifier" },
  { value: "release:cloud", label: "cloud release gate" },
  { value: "decision:history", label: "decision history gate" },
];

const requiredFiles: Record<string, RequiredText[]> = {
  "docs/COMMERCIAL_READINESS.md": [
    { value: "Current Boundary", label: "current boundary section" },
    {
      value: "Commercial Readiness Tracks",
      label: "readiness tracks section",
    },
    { value: "Reviewer Evidence Index", label: "reviewer evidence index" },
    { value: "Identity And Tenant Model", label: "identity track" },
    { value: "Billing And Plan Limits", label: "billing track" },
    {
      value: "docs/COMMERCIAL_ENTITLEMENTS.md",
      label: "commercial entitlements reference",
    },
    {
      value: "docs/COMMERCIAL_BILLING.md",
      label: "commercial billing reference",
    },
    {
      value: "src/lib/launchlens/commercial-entitlements.ts",
      label: "entitlement source reference",
    },
    {
      value: "/api/commercial/entitlements",
      label: "entitlement API reference",
    },
    {
      value: "/api/commercial/subscription",
      label: "subscription API reference",
    },
    {
      value: "src/lib/launchlens/live-provider-usage.ts",
      label: "live-provider usage source reference",
    },
    { value: "/api/webhooks/stripe", label: "Stripe webhook reference" },
    { value: "Onboarding And Activation", label: "onboarding track" },
    { value: "Eval And Ops Visibility", label: "eval and ops track" },
    { value: "Security And Compliance Re-entry", label: "security track" },
    { value: "Acceptance Gate", label: "acceptance gate" },
    { value: "Non-goals", label: "non-goals section" },
    {
      value: "https://launchlens-ai-two.vercel.app/readiness",
      label: "hosted readiness URL",
    },
    {
      value: "npm run verify:commercial-readiness",
      label: "commercial verifier command",
    },
    {
      value: "npm run verify:production-demo",
      label: "production demo command",
    },
    { value: "npm run release:cloud", label: "cloud release command" },
    {
      value: "npm run decision:history -- --window",
      label: "decision history command",
    },
    { value: "PROJECT_MATURITY.md", label: "maturity reference" },
    {
      value: "docs/PORTFOLIO_CASE_STUDY.md",
      label: "case study reference",
    },
    {
      value: "docs/PRODUCTION_RUNBOOK.md",
      label: "runbook reference",
    },
  ],
  "docs/COMMERCIAL_ENTITLEMENTS.md": [
    {
      value: "LaunchLens AI Commercial Entitlements",
      label: "entitlements document heading",
    },
    { value: "Active Preview Plan", label: "active preview plan section" },
    { value: "Plan Matrix", label: "plan matrix section" },
    { value: "Enforced Today", label: "enforcement section" },
    { value: "Still Pending", label: "pending billing section" },
    {
      value: "src/lib/launchlens/commercial-entitlements.ts",
      label: "entitlement source reference",
    },
    {
      value: "src/app/api/commercial/entitlements/route.ts",
      label: "entitlement API source reference",
    },
    {
      value: "/api/commercial/entitlements",
      label: "entitlement API path",
    },
    {
      value: "LAUNCHLENS_COMMERCIAL_PLAN=free|solo|team",
      label: "plan override env",
    },
    {
      value: "npm run verify:commercial-readiness",
      label: "commercial verifier command",
    },
    {
      value: "docs/COMMERCIAL_BILLING.md",
      label: "commercial billing reference",
    },
    {
      value: "src/lib/launchlens/commercial-subscription.ts",
      label: "subscription domain reference",
    },
    {
      value: "src/lib/launchlens/live-provider-usage.ts",
      label: "live-provider usage reference",
    },
  ],
  "docs/COMMERCIAL_BILLING.md": [
    {
      value: "LaunchLens AI Commercial Billing",
      label: "commercial billing heading",
    },
    { value: "Implemented Surface", label: "implemented billing surface" },
    {
      value: "State And Entitlement Precedence",
      label: "subscription precedence section",
    },
    { value: "Webhook Safety", label: "webhook safety section" },
    {
      value: "launchlens_commercial_subscriptions",
      label: "subscription table",
    },
    { value: "launchlens_billing_events", label: "billing event table" },
    {
      value: "launchlens_live_provider_usage",
      label: "live-provider usage table",
    },
    { value: "/api/commercial/checkout", label: "checkout route" },
    { value: "/api/commercial/portal", label: "portal route" },
    { value: "/api/webhooks/stripe", label: "webhook route" },
    { value: "STRIPE_WEBHOOK_SECRET", label: "webhook configuration" },
    {
      value: "npm run verify:commercial-readiness",
      label: "commercial verifier command",
    },
  ],
  "src/app/readiness/page.tsx": [
    {
      value: "Commercial/Productization readiness",
      label: "readiness page heading",
    },
    { value: "Reviewer Evidence Index", label: "evidence index section" },
    { value: "Identity and tenant model", label: "identity track" },
    { value: "Billing and plan limits", label: "billing track" },
    {
      value: "Entitlement Contract",
      label: "entitlement contract section",
    },
    {
      value: "/api/commercial/entitlements",
      label: "entitlement API link",
    },
    { value: "Subscription billing", label: "billing verification row" },
    { value: "/billing", label: "billing page link" },
    {
      value: "/api/commercial/subscription",
      label: "subscription API link",
    },
    { value: "Onboarding and activation", label: "onboarding track" },
    { value: "Eval and ops visibility", label: "eval track" },
    {
      value: "npm run verify:commercial-readiness",
      label: "commercial verifier command",
    },
    {
      value: "docs/COMMERCIAL_READINESS.md",
      label: "commercial readiness doc link",
    },
    ],
  "src/app/api/commercial/entitlements/route.ts": [
    {
      value: "summarizePreviewCommercialEntitlement",
      label: "preview entitlement summary helper",
    },
    {
      value: "commercialPlanRows",
      label: "commercial plan catalog output",
    },
    { value: "noStoreJson", label: "no-store response" },
  ],
  "src/lib/launchlens/commercial-entitlements.ts": [
    {
      value: "DEFAULT_COMMERCIAL_PLAN_ID",
      label: "default commercial plan",
    },
    {
      value: "commercialPlanCatalog",
      label: "commercial plan catalog",
    },
    {
      value: "evaluateCommercialLimit",
      label: "plan limit evaluator",
    },
    {
      value: "commercial_plan_limit_reached",
      label: "stable plan-limit code",
    },
  ],
  "src/lib/launchlens/commercial-entitlements.test.ts": [
    {
      value: "keeps the public preview on the Team entitlement by default",
      label: "default plan test",
    },
    {
      value: "returns a stable code when a plan limit would be exceeded",
      label: "plan-limit code test",
    },
  ],
  "src/app/billing/page.tsx": [
    { value: "CommercialBilling", label: "billing client surface" },
    { value: "Billing - LaunchLens AI", label: "billing page metadata" },
  ],
  "src/components/commercial-billing.tsx": [
    {
      value: "Subscription and plan access",
      label: "billing page heading",
    },
    {
      value: "/api/commercial/subscription",
      label: "subscription status request",
    },
    { value: "/api/commercial/checkout", label: "checkout request" },
    { value: "/api/commercial/portal", label: "portal request" },
    { value: "Live AI usage", label: "live usage summary" },
  ],
  "src/app/api/generate/route.ts": [
    {
      value: "consumeLiveProviderUsageSlot",
      label: "generation live-provider meter",
    },
    {
      value: "workspace_generation",
      label: "generation usage feature",
    },
  ],
  "src/app/api/generate/route.live-usage.test.ts": [
    {
      value: "consumes a monthly live-provider slot before generation",
      label: "generation usage gate test",
    },
    {
      value: "invalid_owner_token",
      label: "generation owner-token guard test",
    },
  ],
  "src/app/api/decision/route.ts": [
    {
      value: "consumeLiveProviderUsageSlot",
      label: "decision live-provider meter",
    },
    {
      value: "DECISION_COPILOT_LIVE_ENABLED",
      label: "decision live-mode flag",
    },
    { value: "decision_brief", label: "decision usage feature" },
  ],
  "src/app/api/decision/route.live-usage.test.ts": [
    {
      value: "consumes a monthly live-provider slot before a real decision brief",
      label: "decision usage gate test",
    },
    {
      value: "does not consume usage when decision live mode is disabled",
      label: "decision demo-mode non-metering test",
    },
  ],
  "src/app/api/commercial/subscription/route.ts": [
    {
      value: "resolveCommercialEntitlementForOwnerHash",
      label: "persisted entitlement resolver",
    },
    {
      value: "getLiveProviderUsageSummaryForOwnerHash",
      label: "live-provider usage summary",
    },
    { value: "safeSubscription", label: "safe subscription projection" },
    { value: "noStoreJson", label: "no-store response" },
  ],
  "src/app/api/commercial/checkout/route.ts": [
    { value: "createStripeCheckout", label: "Stripe Checkout call" },
    {
      value: "ERROR_BILLING_SUBSCRIPTION_EXISTS",
      label: "existing subscription guard",
    },
  ],
  "src/app/api/commercial/portal/route.ts": [
    { value: "createStripePortal", label: "Stripe Portal call" },
    {
      value: "ERROR_BILLING_SUBSCRIPTION_MISSING",
      label: "missing subscription guard",
    },
  ],
  "src/lib/launchlens/error-codes.ts": [
    {
      value: "billing_subscription_exists",
      label: "existing subscription error code",
    },
    {
      value: "billing_subscription_missing",
      label: "missing subscription error code",
    },
    {
      value: "usage_meter_unavailable",
      label: "usage meter unavailable error code",
    },
  ],
  "src/app/api/webhooks/stripe/route.ts": [
    {
      value: "constructStripeWebhookEvent",
      label: "Stripe signature verification",
    },
    {
      value: "applyCommercialSubscriptionEvent",
      label: "idempotent event application",
    },
  ],
  "src/lib/launchlens/commercial-subscription.ts": [
    {
      value: "STRIPE_SUBSCRIPTION_STATUSES",
      label: "Stripe subscription statuses",
    },
    {
      value: "resolveCommercialSubscriptionEntitlement",
      label: "subscription entitlement resolver",
    },
    { value: "graceUntilForPastDue", label: "past due grace helper" },
  ],
  "src/lib/launchlens/commercial-subscription-store.ts": [
    {
      value: "applyCommercialSubscriptionEvent",
      label: "billing event application",
    },
    {
      value: "latest_event_created_at",
      label: "stale event protection",
    },
    {
      value: "processing_status",
      label: "billing event disposition",
    },
  ],
  "src/lib/launchlens/live-provider-usage.ts": [
    {
      value: "consumeLiveProviderUsageSlot",
      label: "usage consume helper",
    },
    {
      value: "launchlens_live_provider_usage",
      label: "usage table reference",
    },
    {
      value: "liveProviderRunsPerMonth",
      label: "monthly plan limit",
    },
    {
      value: "pg_advisory_xact_lock",
      label: "usage concurrency guard",
    },
  ],
  "src/lib/launchlens/live-provider-usage.test.ts": [
    {
      value: "atomically consumes a monthly slot before a live provider request",
      label: "usage consume test",
    },
    {
      value: "rejects a full monthly bucket without consuming another slot",
      label: "usage limit test",
    },
  ],
  "src/lib/launchlens/stripe-server.ts": [
    { value: "constructEvent", label: "raw webhook signature verification" },
    {
      value: "subscription_data",
      label: "Checkout subscription metadata",
    },
    { value: "idempotencyKey", label: "Checkout idempotency key" },
  ],
  "scripts/migrate-cloud-db.ts": [
    {
      value: "launchlens_commercial_subscriptions",
      label: "subscription migration",
    },
    { value: "launchlens_billing_events", label: "billing event migration" },
    {
      value: "launchlens_live_provider_usage",
      label: "live-provider usage migration",
    },
  ],
  "src/lib/launchlens/cloud-db-contract.ts": [
    {
      value: "launchlens_commercial_subscriptions",
      label: "subscription schema contract",
    },
    {
      value: "launchlens_billing_events",
      label: "billing event schema contract",
    },
    {
      value: "launchlens_live_provider_usage",
      label: "live-provider usage schema contract",
    },
  ],
  "README.md": [
    { value: "docs/COMMERCIAL_READINESS.md", label: "readiness doc link" },
    {
      value: "docs/COMMERCIAL_ENTITLEMENTS.md",
      label: "entitlements doc link",
    },
    {
      value: "docs/COMMERCIAL_BILLING.md",
      label: "billing doc link",
    },
    {
      value: "/api/commercial/entitlements",
      label: "entitlement API path",
    },
    {
      value: "https://launchlens-ai-two.vercel.app/readiness",
      label: "hosted readiness URL",
    },
    {
      value: "verify:commercial-readiness",
      label: "commercial verifier command",
    },
  ],
  "docs/PORTFOLIO_CASE_STUDY.md": [
    { value: "docs/COMMERCIAL_READINESS.md", label: "readiness doc link" },
    {
      value: "https://launchlens-ai-two.vercel.app/readiness",
      label: "hosted readiness URL",
    },
  ],
  "docs/DEMO_SCRIPT.md": [
    { value: "docs/COMMERCIAL_READINESS.md", label: "readiness doc link" },
    {
      value: "https://launchlens-ai-two.vercel.app/readiness",
      label: "hosted readiness URL",
    },
  ],
  "PROJECT_MATURITY.md": [
    { value: "docs/COMMERCIAL_READINESS.md", label: "readiness doc link" },
    {
      value: "Commercial/Productization Readiness",
      label: "commercial readiness heading",
    },
  ],
  "ROADMAP.md": [
    {
      value: "Phase 7: Commercial/Productization Readiness",
      label: "phase 7 roadmap",
    },
    {
      value: "docs/COMMERCIAL_READINESS.md",
      label: "readiness doc reference",
    },
  ],
  "TASKS.md": [
    {
      value: "Commercial/Productization Readiness",
      label: "commercial readiness task section",
    },
    {
      value: "npm run verify:commercial-readiness",
      label: "commercial verifier task",
    },
  ],
};

function findFile(snapshot: CommercialReadinessSnapshot, path: string) {
  return snapshot.files.find((file) => file.path === path);
}

function missingTextIssues(
  path: string,
  content: string,
  requiredTexts: RequiredText[],
) {
  return requiredTexts
    .filter((text) => !content.includes(text.value))
    .map((text) => ({
      path,
      message: `Missing ${text.label}: ${text.value}`,
    }));
}

export function evaluateCommercialReadiness(
  snapshot: CommercialReadinessSnapshot,
): CommercialReadinessIssue[] {
  const issues: CommercialReadinessIssue[] = [];
  const scripts = snapshot.packageJson.scripts ?? {};

  for (const script of requiredScripts) {
    if (!scripts[script.value]) {
      issues.push({
        path: "package.json",
        message: `Missing ${script.label}: ${script.value}`,
      });
    }
  }

  for (const [path, requiredTexts] of Object.entries(requiredFiles)) {
    const file = findFile(snapshot, path);

    if (!file) {
      issues.push({ path, message: "Missing required readiness file." });
      continue;
    }

    issues.push(...missingTextIssues(path, file.content, requiredTexts));
  }

  return issues;
}
