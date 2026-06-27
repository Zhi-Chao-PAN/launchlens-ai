import { readFileSync } from "node:fs";

import {
  evaluateCommercialReadiness,
  type CommercialReadinessFile,
} from "../src/lib/launchlens/commercial-readiness";

const requiredPaths = [
  "docs/COMMERCIAL_READINESS.md",
  "docs/COMMERCIAL_ENTITLEMENTS.md",
  "src/app/readiness/page.tsx",
  "src/app/api/commercial/entitlements/route.ts",
  "src/lib/launchlens/commercial-entitlements.ts",
  "src/lib/launchlens/commercial-entitlements.test.ts",
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
