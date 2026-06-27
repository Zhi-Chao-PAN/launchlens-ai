export type PortfolioPackageFile = {
  path: string;
  content: string;
};

export type PortfolioPackageSnapshot = {
  packageJson: {
    scripts?: Record<string, string>;
  };
  files: PortfolioPackageFile[];
};

export type PortfolioPackageIssue = {
  path: string;
  message: string;
};

type RequiredText = {
  value: string;
  label: string;
};

const requiredScripts: RequiredText[] = [
  { value: "verify:portfolio", label: "portfolio package verifier" },
  { value: "verify:release-readiness", label: "release readiness verifier" },
  { value: "verify:production-demo", label: "production demo verifier" },
  { value: "release:cloud", label: "cloud release gate" },
  { value: "evidence:release", label: "release evidence collector" },
];

const requiredFiles: Record<string, RequiredText[]> = {
  "README.md": [
    { value: "https://launchlens-ai-two.vercel.app/case-study", label: "hosted case study URL" },
    { value: "/case-study", label: "case study route" },
    { value: "docs/PORTFOLIO_CASE_STUDY.md", label: "case study link" },
    { value: "docs/DEMO_SCRIPT.md", label: "demo script link" },
    { value: "https://launchlens-ai-two.vercel.app", label: "live demo URL" },
    { value: "verify:portfolio", label: "portfolio verifier command" },
  ],
  "docs/PORTFOLIO_CASE_STUDY.md": [
    { value: "https://launchlens-ai-two.vercel.app/case-study", label: "hosted case study URL" },
    { value: "https://launchlens-ai-two.vercel.app", label: "live demo URL" },
    { value: "Reviewer Quick Path", label: "reviewer quick path" },
    { value: "Product Answer", label: "product answer section" },
    { value: "AI Product Engineering", label: "AI product engineering section" },
    { value: "Full-Stack SaaS Shape", label: "full-stack SaaS section" },
    { value: "Release And Operations", label: "release operations section" },
    { value: "Evidence Map", label: "evidence map" },
    { value: "docs/DEMO_SCRIPT.md", label: "demo script reference" },
    { value: "docs/PRODUCTION_RUNBOOK.md", label: "runbook reference" },
    {
      value: "docs/PRODUCTION_RELEASE_PACKET.md",
      label: "production packet reference",
    },
    { value: "npm run verify:production-demo", label: "production demo gate" },
    { value: "npm run release:cloud", label: "cloud gate" },
    { value: "npm run verify:portfolio", label: "portfolio verifier" },
  ],
  "docs/DEMO_SCRIPT.md": [
    { value: "https://launchlens-ai-two.vercel.app/case-study", label: "hosted case study URL" },
    { value: "/case-study", label: "case study route" },
    { value: "docs/PORTFOLIO_CASE_STUDY.md", label: "case study reference" },
    { value: "https://launchlens-ai-two.vercel.app", label: "live demo URL" },
  ],
  "src/app/case-study/page.tsx": [
    { value: "LaunchLens AI case study", label: "case study metadata" },
    { value: "Portfolio case study", label: "case study page badge" },
    { value: "Open product", label: "product CTA" },
    { value: "Read written case study", label: "written case study CTA" },
    { value: "/screenshots/launchlens-desktop.png", label: "desktop screenshot" },
    { value: "/screenshots/launchlens-mobile.png", label: "mobile screenshot" },
    { value: "Evidence map", label: "evidence map section" },
    { value: "npm run verify:portfolio", label: "portfolio verifier command" },
    { value: "npm run verify:production-demo", label: "production demo command" },
    { value: "View verification", label: "verification CTA" },
  ],
  "docs/PRODUCTION_RELEASE_PACKET.md": [
    { value: "docs/PORTFOLIO_CASE_STUDY.md", label: "case study reference" },
    { value: "Post-promotion verification", label: "post-promotion workflow" },
  ],
  "docs/PRODUCTION_RUNBOOK.md": [
    { value: "Post-promotion verification", label: "post-promotion workflow" },
    { value: "LAUNCHLENS_SMOKE_DATABASE_URL", label: "cloud smoke secret" },
  ],
};

function findFile(snapshot: PortfolioPackageSnapshot, path: string) {
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

export function evaluatePortfolioPackage(
  snapshot: PortfolioPackageSnapshot,
): PortfolioPackageIssue[] {
  const issues: PortfolioPackageIssue[] = [];
  const scripts = snapshot.packageJson.scripts ?? {};

  for (const script of requiredScripts) {
    if (!scripts[script.value]) {
      issues.push({
        path: "package.json",
        message: `Missing ${script.label}: ${script.value}`,
      });
    }
  }

  for (const [path, requiredTexts] of Object.entries(requiredFiles)) {
    const file = findFile(snapshot, path);

    if (!file) {
      issues.push({ path, message: "Missing required portfolio file." });
      continue;
    }

    issues.push(...missingTextIssues(path, file.content, requiredTexts));
  }

  return issues;
}
