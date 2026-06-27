import { describe, expect, it } from "vitest";

import {
  evaluateReleaseReadiness,
  type ReleaseReadinessSnapshot,
} from "./release-readiness";

function snapshot(): ReleaseReadinessSnapshot {
  return {
    packageJson: {
      scripts: {
        "release:local": "npm run quality && npm run test:e2e",
        "release:cloud": "npm run verify:public-demo && npm run db:migrate",
        "evidence:release": "tsx scripts/collect-release-evidence.ts",
        "verify:public-demo": "tsx scripts/verify-public-demo.ts",
        "verify:production-demo": "tsx scripts/verify-production-demo.ts",
        "verify:portfolio": "tsx scripts/verify-portfolio-package.ts",
        "verify:cloud-db": "tsx scripts/verify-cloud-db.ts",
        "verify:release-readiness":
          "tsx scripts/verify-release-readiness.ts",
        "smoke:cloud": "tsx scripts/smoke-cloud-workspace.ts",
        "smoke:tenant": "tsx scripts/smoke-tenant.ts",
        "smoke:rbac": "tsx scripts/smoke-rbac.ts",
      },
    },
    files: [
      {
        path: ".github/workflows/release-candidate-verify.yml",
        content:
          "workflow_dispatch npm run verify:release-readiness npm run verify:portfolio npm run release:local npm run evidence:release upload-artifact launchlens-rc-evidence",
      },
      {
        path: ".github/workflows/post-promotion-verify.yml",
        content:
          "workflow_dispatch LAUNCHLENS_SMOKE_DATABASE_URL npm run verify:release-readiness npm run verify:portfolio npm run release:cloud npm run verify:production-demo npm run evidence:release upload-artifact launchlens-release-evidence",
      },
      {
        path: "docs/PRODUCTION_RUNBOOK.md",
        content:
          "Release candidate verification Post-promotion verification npm run release:local npm run release:cloud npm run verify:production-demo npm run evidence:release Rollback",
      },
      {
        path: "docs/PRODUCTION_RELEASE_PACKET.md",
        content:
          "Go / No-Go Explicit Production Approval npm run release:cloud npm run verify:production-demo production_verified docs/PORTFOLIO_CASE_STUDY.md",
      },
      {
        path: "docs/PORTFOLIO_CASE_STUDY.md",
        content:
          "https://launchlens-ai-two.vercel.app/case-study Reviewer Quick Path Evidence Map npm run verify:portfolio npm run release:cloud docs/PRODUCTION_RUNBOOK.md",
      },
      {
        path: "docs/DEMO_SCRIPT.md",
        content:
          "https://launchlens-ai-two.vercel.app/case-study docs/PORTFOLIO_CASE_STUDY.md release gates",
      },
      {
        path: "src/app/case-study/page.tsx",
        content:
          "LaunchLens AI case study Evidence map npm run verify:portfolio npm run verify:production-demo",
      },
      {
        path: "docs/RELEASE_CANDIDATE.md",
        content:
          "promotion_pending production_verified Release candidate verification",
      },
      {
        path: "README.md",
        content:
          "https://launchlens-ai-two.vercel.app/case-study /case-study docs/PORTFOLIO_CASE_STUDY.md docs/PRODUCTION_RUNBOOK.md docs/DEMO_SCRIPT.md Release candidate verification verify:portfolio",
      },
      {
        path: ".gitignore",
        content: "/output/",
      },
    ],
  };
}

describe("release readiness", () => {
  it("accepts the expected release packet shape", () => {
    expect(evaluateReleaseReadiness(snapshot())).toEqual([]);
  });

  it("requires release scripts", () => {
    const input = snapshot();
    delete input.packageJson.scripts?.["release:cloud"];

    expect(evaluateReleaseReadiness(input)).toContainEqual({
      path: "package.json",
      message: "Missing cloud release gate: release:cloud",
    });
  });

  it("rejects production deploy commands in the pre-promotion workflow", () => {
    const input = snapshot();
    const workflow = input.files.find(
      (file) => file.path === ".github/workflows/release-candidate-verify.yml",
    );

    if (workflow) {
      workflow.content += " vercel deploy --prod";
    }

    expect(evaluateReleaseReadiness(input)).toEqual(
      expect.arrayContaining([
        {
          path: ".github/workflows/release-candidate-verify.yml",
          message: "Unexpected production deploy flag: --prod",
        },
        {
          path: ".github/workflows/release-candidate-verify.yml",
          message: "Unexpected Vercel deploy command: vercel deploy",
        },
      ]),
    );
  });
});
