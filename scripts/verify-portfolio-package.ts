import { readFileSync } from "node:fs";

import {
  evaluatePortfolioPackage,
  type PortfolioPackageFile,
} from "../src/lib/launchlens/portfolio-package";

const requiredPaths = [
  "README.md",
  "docs/PORTFOLIO_CASE_STUDY.md",
  "docs/DEMO_SCRIPT.md",
  "docs/PRODUCTION_RELEASE_PACKET.md",
  "docs/PRODUCTION_RUNBOOK.md",
];

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf8")) as {
    scripts?: Record<string, string>;
  };
}

function readFiles(paths: string[]): PortfolioPackageFile[] {
  return paths.map((path) => ({
    path,
    content: readFileSync(path, "utf8"),
  }));
}

const issues = evaluatePortfolioPackage({
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

