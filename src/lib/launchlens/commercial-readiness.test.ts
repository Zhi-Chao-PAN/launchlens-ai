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
          "Current Boundary Commercial Readiness Tracks Reviewer Evidence Index Identity And Tenant Model Billing And Plan Limits Onboarding And Activation Eval And Ops Visibility Security And Compliance Re-entry Acceptance Gate Non-goals https://launchlens-ai-two.vercel.app/readiness npm run verify:commercial-readiness npm run verify:production-demo npm run release:cloud npm run decision:history -- --window PROJECT_MATURITY.md docs/PORTFOLIO_CASE_STUDY.md docs/PRODUCTION_RUNBOOK.md",
      },
      {
        path: "src/app/readiness/page.tsx",
        content:
          "Commercial/Productization readiness Reviewer Evidence Index Identity and tenant model Billing and plan limits Onboarding and activation Eval and ops visibility npm run verify:commercial-readiness docs/COMMERCIAL_READINESS.md",
      },
      {
        path: "README.md",
        content:
          "docs/COMMERCIAL_READINESS.md https://launchlens-ai-two.vercel.app/readiness verify:commercial-readiness",
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
