import { readFileSync } from "node:fs";

import {
  evaluateReleaseReadiness,
  type ReleaseReadinessFile,
} from "../src/lib/launchlens/release-readiness";

const requiredPaths = [
  ".github/workflows/release-candidate-verify.yml",
  ".github/workflows/post-promotion-verify.yml",
  "docs/PRODUCTION_RUNBOOK.md",
  "docs/PRODUCTION_RELEASE_PACKET.md",
  "docs/PORTFOLIO_CASE_STUDY.md",
  "docs/DEMO_SCRIPT.md",
  "src/app/case-study/page.tsx",
  "docs/RELEASE_CANDIDATE.md",
  "README.md",
  ".gitignore",
];

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf8")) as {
    scripts?: Record<string, string>;
  };
}

function readFiles(paths: string[]): ReleaseReadinessFile[] {
  return paths.map((path) => ({
    path,
    content: readFileSync(path, "utf8"),
  }));
}

const issues = evaluateReleaseReadiness({
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
