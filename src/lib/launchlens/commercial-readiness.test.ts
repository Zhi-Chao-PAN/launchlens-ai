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
          "Current Boundary Commercial Readiness Tracks Reviewer Evidence Index Identity And Tenant Model Billing And Plan Limits docs/COMMERCIAL_ENTITLEMENTS.md src/lib/launchlens/commercial-entitlements.ts /api/commercial/entitlements Onboarding And Activation Eval And Ops Visibility Security And Compliance Re-entry Acceptance Gate Non-goals https://launchlens-ai-two.vercel.app/readiness npm run verify:commercial-readiness npm run verify:production-demo npm run release:cloud npm run decision:history -- --window PROJECT_MATURITY.md docs/PORTFOLIO_CASE_STUDY.md docs/PRODUCTION_RUNBOOK.md",
      },
      {
        path: "docs/COMMERCIAL_ENTITLEMENTS.md",
        content:
          "LaunchLens AI Commercial Entitlements Active Preview Plan Plan Matrix Enforced Today Still Pending src/lib/launchlens/commercial-entitlements.ts src/app/api/commercial/entitlements/route.ts /api/commercial/entitlements LAUNCHLENS_COMMERCIAL_PLAN=free|solo|team npm run verify:commercial-readiness",
      },
      {
        path: "src/app/readiness/page.tsx",
        content:
          "Commercial/Productization readiness Reviewer Evidence Index Identity and tenant model Billing and plan limits Entitlement Contract /api/commercial/entitlements Onboarding and activation Eval and ops visibility npm run verify:commercial-readiness docs/COMMERCIAL_READINESS.md",
      },
      {
        path: "src/app/api/commercial/entitlements/route.ts",
        content:
          "summarizeCommercialEntitlement commercialPlanRows noStoreJson",
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
        path: "README.md",
        content:
          "docs/COMMERCIAL_READINESS.md docs/COMMERCIAL_ENTITLEMENTS.md /api/commercial/entitlements https://launchlens-ai-two.vercel.app/readiness verify:commercial-readiness",
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
