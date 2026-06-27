import { describe, expect, it } from "vitest";

import {
  evaluatePortfolioPackage,
  type PortfolioPackageSnapshot,
} from "./portfolio-package";

function snapshot(): PortfolioPackageSnapshot {
  return {
    packageJson: {
      scripts: {
        "verify:portfolio": "tsx scripts/verify-portfolio-package.ts",
        "verify:commercial-readiness":
          "tsx scripts/verify-commercial-readiness.ts",
        "verify:release-readiness":
          "tsx scripts/verify-release-readiness.ts",
        "verify:production-demo": "tsx scripts/verify-production-demo.ts",
        "release:cloud": "npm run verify:public-demo",
        "evidence:release": "tsx scripts/collect-release-evidence.ts",
      },
    },
    files: [
      {
        path: "README.md",
        content:
          "https://launchlens-ai-two.vercel.app/case-study https://launchlens-ai-two.vercel.app/readiness /case-study /readiness docs/COMMERCIAL_READINESS.md docs/PORTFOLIO_CASE_STUDY.md docs/DEMO_SCRIPT.md https://launchlens-ai-two.vercel.app verify:portfolio",
      },
      {
        path: "src/app/case-study/page.tsx",
        content:
          "LaunchLens AI case study Portfolio case study Open product Read written case study /screenshots/launchlens-desktop.png /screenshots/launchlens-mobile.png Evidence map Commercial readiness npm run verify:portfolio npm run verify:production-demo View verification",
      },
      {
        path: "src/app/readiness/page.tsx",
        content:
          "Commercial/Productization readiness Reviewer Evidence Index npm run verify:commercial-readiness",
      },
      {
        path: "docs/COMMERCIAL_READINESS.md",
        content:
          "Commercial Readiness Tracks Reviewer Evidence Index npm run verify:commercial-readiness https://launchlens-ai-two.vercel.app/readiness",
      },
      {
        path: "docs/PORTFOLIO_CASE_STUDY.md",
        content:
          "https://launchlens-ai-two.vercel.app/case-study https://launchlens-ai-two.vercel.app/readiness docs/COMMERCIAL_READINESS.md https://launchlens-ai-two.vercel.app Reviewer Quick Path Product Answer AI Product Engineering Full-Stack SaaS Shape Release And Operations Evidence Map docs/DEMO_SCRIPT.md docs/PRODUCTION_RUNBOOK.md docs/PRODUCTION_RELEASE_PACKET.md npm run verify:production-demo npm run release:cloud npm run verify:portfolio",
      },
      {
        path: "docs/DEMO_SCRIPT.md",
        content:
          "https://launchlens-ai-two.vercel.app/case-study https://launchlens-ai-two.vercel.app/readiness /case-study /readiness docs/COMMERCIAL_READINESS.md docs/PORTFOLIO_CASE_STUDY.md https://launchlens-ai-two.vercel.app",
      },
      {
        path: "docs/PRODUCTION_RELEASE_PACKET.md",
        content:
          "docs/PORTFOLIO_CASE_STUDY.md Post-promotion verification",
      },
      {
        path: "docs/PRODUCTION_RUNBOOK.md",
        content:
          "Post-promotion verification LAUNCHLENS_SMOKE_DATABASE_URL",
      },
    ],
  };
}

describe("portfolio package", () => {
  it("accepts the expected portfolio package shape", () => {
    expect(evaluatePortfolioPackage(snapshot())).toEqual([]);
  });

  it("requires the portfolio verifier script", () => {
    const input = snapshot();
    delete input.packageJson.scripts?.["verify:portfolio"];

    expect(evaluatePortfolioPackage(input)).toContainEqual({
      path: "package.json",
      message: "Missing portfolio package verifier: verify:portfolio",
    });
  });

  it("requires the reviewer case study to be linked from README", () => {
    const input = snapshot();
    const readme = input.files.find((file) => file.path === "README.md");

    if (readme) {
      readme.content = readme.content.replace(
        "docs/PORTFOLIO_CASE_STUDY.md",
        "",
      );
    }

    expect(evaluatePortfolioPackage(input)).toContainEqual({
      path: "README.md",
      message:
        "Missing case study link: docs/PORTFOLIO_CASE_STUDY.md",
    });
  });
});
