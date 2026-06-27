export type ReleaseReadinessFile = {
  path: string;
  content: string;
};

export type ReleaseReadinessSnapshot = {
  packageJson: {
    scripts?: Record<string, string>;
  };
  files: ReleaseReadinessFile[];
};

export type ReleaseReadinessIssue = {
  path: string;
  message: string;
};

type RequiredText = {
  value: string;
  label: string;
};

const requiredPackageScripts: RequiredText[] = [
  { value: "release:local", label: "local release gate" },
  { value: "release:cloud", label: "cloud release gate" },
  { value: "evidence:release", label: "release evidence collector" },
  { value: "verify:public-demo", label: "public demo verifier" },
  { value: "verify:production-demo", label: "production demo verifier" },
  { value: "verify:portfolio", label: "portfolio package verifier" },
  { value: "verify:cloud-db", label: "cloud database verifier" },
  { value: "smoke:cloud", label: "cloud workspace smoke" },
  { value: "smoke:tenant", label: "tenant isolation smoke" },
  { value: "smoke:rbac", label: "RBAC smoke" },
];

const requiredFiles: Record<string, RequiredText[]> = {
  ".github/workflows/release-candidate-verify.yml": [
    { value: "workflow_dispatch", label: "manual trigger" },
    { value: "npm run verify:release-readiness", label: "readiness check" },
    { value: "npm run verify:portfolio", label: "portfolio package check" },
    { value: "npm run release:local", label: "local release gate" },
    { value: "npm run evidence:release", label: "release evidence step" },
    { value: "upload-artifact", label: "artifact upload" },
    { value: "launchlens-rc-evidence", label: "RC evidence artifact" },
  ],
  ".github/workflows/post-promotion-verify.yml": [
    { value: "workflow_dispatch", label: "manual trigger" },
    { value: "LAUNCHLENS_SMOKE_DATABASE_URL", label: "cloud smoke secret" },
    { value: "npm run verify:release-readiness", label: "readiness check" },
    { value: "npm run verify:portfolio", label: "portfolio package check" },
    { value: "npm run release:cloud", label: "cloud release gate" },
    { value: "npm run verify:production-demo", label: "production demo gate" },
    { value: "npm run evidence:release", label: "release evidence step" },
    { value: "upload-artifact", label: "artifact upload" },
    { value: "launchlens-release-evidence", label: "release evidence artifact" },
  ],
  "docs/PRODUCTION_RUNBOOK.md": [
    { value: "Release candidate verification", label: "pre-promotion workflow" },
    { value: "Post-promotion verification", label: "post-promotion workflow" },
    { value: "npm run release:local", label: "local release gate" },
    { value: "npm run release:cloud", label: "cloud release gate" },
    { value: "npm run verify:production-demo", label: "production demo gate" },
    { value: "npm run evidence:release", label: "release evidence command" },
    { value: "Rollback", label: "rollback section" },
  ],
  "docs/PRODUCTION_RELEASE_PACKET.md": [
    { value: "Go / No-Go", label: "go/no-go decision section" },
    { value: "Explicit Production Approval", label: "approval boundary" },
    { value: "npm run release:cloud", label: "cloud release gate" },
    { value: "npm run verify:production-demo", label: "production demo gate" },
    { value: "production_verified", label: "target evidence state" },
    { value: "docs/PORTFOLIO_CASE_STUDY.md", label: "case study handoff" },
  ],
  "docs/PORTFOLIO_CASE_STUDY.md": [
    { value: "https://launchlens-ai-two.vercel.app/case-study", label: "hosted case study URL" },
    { value: "Reviewer Quick Path", label: "reviewer quick path" },
    { value: "Evidence Map", label: "evidence map" },
    { value: "npm run verify:portfolio", label: "portfolio verifier" },
    { value: "npm run release:cloud", label: "cloud release gate" },
    { value: "docs/PRODUCTION_RUNBOOK.md", label: "runbook reference" },
  ],
  "docs/DEMO_SCRIPT.md": [
    { value: "https://launchlens-ai-two.vercel.app/case-study", label: "hosted case study URL" },
    { value: "docs/PORTFOLIO_CASE_STUDY.md", label: "case study reference" },
    { value: "release gates", label: "release gate narrative" },
  ],
  "src/app/case-study/page.tsx": [
    { value: "LaunchLens AI case study", label: "case study metadata" },
    { value: "Evidence map", label: "case study evidence map" },
    { value: "npm run verify:portfolio", label: "portfolio verifier command" },
    { value: "npm run verify:production-demo", label: "production demo command" },
  ],
  "docs/RELEASE_CANDIDATE.md": [
    { value: "promotion_pending", label: "pre-promotion evidence state" },
    { value: "production_verified", label: "post-promotion evidence state" },
    { value: "Release candidate verification", label: "pre-promotion workflow" },
  ],
  "README.md": [
    { value: "https://launchlens-ai-two.vercel.app/case-study", label: "hosted case study URL" },
    { value: "/case-study", label: "case study route" },
    { value: "docs/PORTFOLIO_CASE_STUDY.md", label: "case study link" },
    { value: "docs/PRODUCTION_RUNBOOK.md", label: "production runbook link" },
    { value: "docs/DEMO_SCRIPT.md", label: "demo script link" },
    { value: "Release candidate verification", label: "hosted RC audit" },
    { value: "verify:portfolio", label: "portfolio verifier command" },
  ],
  ".gitignore": [{ value: "/output/", label: "ignored evidence output" }],
};

const forbiddenWorkflowTexts: Record<string, RequiredText[]> = {
  ".github/workflows/release-candidate-verify.yml": [
    { value: "--prod", label: "production deploy flag" },
    { value: "vercel deploy", label: "Vercel deploy command" },
    { value: "npm run release:cloud", label: "cloud mutation gate" },
    { value: "npm run db:migrate", label: "database migration" },
  ],
};

function findFile(snapshot: ReleaseReadinessSnapshot, path: string) {
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

function forbiddenTextIssues(
  path: string,
  content: string,
  forbiddenTexts: RequiredText[],
) {
  return forbiddenTexts
    .filter((text) => content.includes(text.value))
    .map((text) => ({
      path,
      message: `Unexpected ${text.label}: ${text.value}`,
    }));
}

export function evaluateReleaseReadiness(
  snapshot: ReleaseReadinessSnapshot,
): ReleaseReadinessIssue[] {
  const issues: ReleaseReadinessIssue[] = [];
  const scripts = snapshot.packageJson.scripts ?? {};

  for (const script of requiredPackageScripts) {
    if (!scripts[script.value]) {
      issues.push({
        path: "package.json",
        message: `Missing ${script.label}: ${script.value}`,
      });
    }
  }

  if (!scripts["verify:release-readiness"]) {
    issues.push({
      path: "package.json",
      message: "Missing release readiness verifier: verify:release-readiness",
    });
  }

  for (const [path, requiredTexts] of Object.entries(requiredFiles)) {
    const file = findFile(snapshot, path);

    if (!file) {
      issues.push({ path, message: "Missing required release file." });
      continue;
    }

    issues.push(...missingTextIssues(path, file.content, requiredTexts));

    const forbiddenTexts = forbiddenWorkflowTexts[path] ?? [];
    issues.push(...forbiddenTextIssues(path, file.content, forbiddenTexts));
  }

  return issues;
}
