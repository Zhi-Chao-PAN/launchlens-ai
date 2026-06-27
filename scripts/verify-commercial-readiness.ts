import { readFileSync } from "node:fs";

import {
  evaluateCommercialReadiness,
  type CommercialReadinessFile,
} from "../src/lib/launchlens/commercial-readiness";

const requiredPaths = [
  "docs/COMMERCIAL_READINESS.md",
  "src/app/readiness/page.tsx",
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
