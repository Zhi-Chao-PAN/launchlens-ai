import { readFileSync } from "node:fs";

import {
  evaluateCommercialReadiness,
  type CommercialReadinessFile,
} from "../src/lib/launchlens/commercial-readiness";

const requiredPaths = [
  "docs/COMMERCIAL_READINESS.md",
  "docs/COMMERCIAL_ENTITLEMENTS.md",
  "docs/COMMERCIAL_BILLING.md",
  "src/app/readiness/page.tsx",
  "src/app/billing/page.tsx",
  "src/components/commercial-billing.tsx",
  "src/app/api/generate/route.ts",
  "src/app/api/generate/route.live-usage.test.ts",
  "src/app/api/decision/route.ts",
  "src/app/api/decision/route.live-usage.test.ts",
  "src/app/api/commercial/entitlements/route.ts",
  "src/app/api/commercial/subscription/route.ts",
  "src/app/api/commercial/subscription/route.test.ts",
  "src/app/api/commercial/checkout/route.ts",
  "src/app/api/commercial/checkout/route.test.ts",
  "src/app/api/commercial/portal/route.ts",
  "src/app/api/commercial/portal/route.test.ts",
  "src/app/api/webhooks/stripe/route.ts",
  "src/app/api/webhooks/stripe/route.test.ts",
  "src/lib/launchlens/commercial-entitlements.ts",
  "src/lib/launchlens/commercial-entitlements.test.ts",
  "src/lib/launchlens/error-codes.ts",
  "src/lib/launchlens/commercial-subscription.ts",
  "src/lib/launchlens/commercial-subscription.test.ts",
  "src/lib/launchlens/commercial-subscription-store.ts",
  "src/lib/launchlens/live-provider-usage.ts",
  "src/lib/launchlens/live-provider-usage.test.ts",
  "src/lib/launchlens/stripe-billing.ts",
  "src/lib/launchlens/stripe-billing.test.ts",
  "src/lib/launchlens/stripe-server.ts",
  "src/lib/launchlens/stripe-server.test.ts",
  "scripts/migrate-cloud-db.ts",
  "src/lib/launchlens/cloud-db-contract.ts",
  "README.md",
  "docs/PORTFOLIO_CASE_STUDY.md",
  "docs/DEMO_SCRIPT.md",
  "PROJECT_MATURITY.md",
  "ROADMAP.md",
  "TASKS.md",
];

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf8")) as {
    scripts?: Record<string, string>;
  };
}

function readFiles(paths: string[]): CommercialReadinessFile[] {
  return paths.map((path) => ({
    path,
    content: readFileSync(path, "utf8"),
  }));
}

const issues = evaluateCommercialReadiness({
  packageJson: readJson("package.json"),
  files: readFiles(requiredPaths),
});

console.log(
  JSON.stringify(
    {
      ok: issues.length === 0,
      checkedFiles: requiredPaths.length,
      issues,
    },
    null,
    2,
  ),
);

if (issues.length > 0) {
  process.exitCode = 1;
}
