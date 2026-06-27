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
      value: "src/lib/launchlens/commercial-entitlements.ts",
      label: "entitlement source reference",
    },
    {
      value: "/api/commercial/entitlements",
      label: "entitlement API reference",
    },
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
      value: "summarizeCommercialEntitlement",
      label: "entitlement summary helper",
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
  "README.md": [
    { value: "docs/COMMERCIAL_READINESS.md", label: "readiness doc link" },
    {
      value: "docs/COMMERCIAL_ENTITLEMENTS.md",
      label: "entitlements doc link",
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
