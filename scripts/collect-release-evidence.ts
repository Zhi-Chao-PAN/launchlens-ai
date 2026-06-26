import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  evaluatePublicDemoStatus,
  type PublicDemoStatus,
  type PublicDemoVerificationResult,
} from "../src/lib/launchlens/public-demo-verification";
import {
  buildReleaseEvidenceMarkdown,
  summarizeReleaseEvidence,
  type GitReleaseEvidence,
  type ReleaseEvidenceReport,
} from "../src/lib/launchlens/release-evidence";

const baseUrl = (
  process.env.LAUNCHLENS_BASE_URL ?? "https://launchlens-ai-two.vercel.app"
).replace(/\/$/, "");
const outputDir =
  process.env.LAUNCHLENS_RELEASE_EVIDENCE_DIR ??
  "output/release-evidence";

function git(args: string[], fallback: string | null = null) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return fallback;
  }
}

function parseAheadCount(value: string | null) {
  if (value === null || value.length === 0) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function redactRemoteUrl(value: string | null) {
  if (value === null) {
    return null;
  }

  return value.replace(/:\/\/[^/@]+@/, "://<redacted>@");
}

function collectGitEvidence(): GitReleaseEvidence {
  const branch = git(["branch", "--show-current"], "unknown") ?? "unknown";
  const headSha = git(["rev-parse", "HEAD"], "unknown") ?? "unknown";
  const shortSha =
    git(["rev-parse", "--short", "HEAD"], headSha.slice(0, 7)) ??
    headSha.slice(0, 7);
  const upstream = git([
    "rev-parse",
    "--abbrev-ref",
    "--symbolic-full-name",
    "@{upstream}",
  ]);
  const ahead =
    upstream === null
      ? null
      : parseAheadCount(git(["rev-list", "--count", `${upstream}..HEAD`]));
  const status = git(["status", "--short"], "") ?? "";
  const remoteUrl = redactRemoteUrl(git(["config", "--get", "remote.origin.url"]));

  return {
    branch,
    headSha,
    shortSha,
    upstream,
    ahead,
    dirty: status.length > 0,
    remoteUrl,
  };
}

function withExtraIssues(
  result: PublicDemoVerificationResult,
  extraIssues: string[],
): PublicDemoVerificationResult {
  const issues = [...result.issues, ...extraIssues];

  return {
    ...result,
    ok: result.ok && extraIssues.length === 0,
    issues,
  };
}

async function fetchPublicStatus(): Promise<{
  status: PublicDemoStatus;
  httpStatus: number | null;
  contentType: string | null;
  issues: string[];
}> {
  try {
    const response = await fetch(`${baseUrl}/api/status`, {
      headers: { accept: "application/json" },
    });
    const contentType = response.headers.get("content-type");
    const issues: string[] = [];

    if (response.status !== 200) {
      issues.push(`/api/status returned HTTP ${response.status}.`);
    }

    if (!contentType?.includes("application/json")) {
      issues.push(
        `Expected LaunchLens JSON from /api/status, received ${response.status} ${contentType ?? "unknown content-type"}.`,
      );
      return {
        status: {},
        httpStatus: response.status,
        contentType,
        issues,
      };
    }

    try {
      return {
        status: (await response.json()) as PublicDemoStatus,
        httpStatus: response.status,
        contentType,
        issues,
      };
    } catch {
      return {
        status: {},
        httpStatus: response.status,
        contentType,
        issues: [...issues, "Expected valid JSON from /api/status."],
      };
    }
  } catch (error: unknown) {
    return {
      status: {},
      httpStatus: null,
      contentType: null,
      issues: [
        error instanceof Error
          ? `Failed to fetch /api/status: ${error.message}`
          : "Failed to fetch /api/status.",
      ],
    };
  }
}

async function main() {
  const gitEvidence = collectGitEvidence();
  const expectedGitSha =
    process.env.LAUNCHLENS_EXPECTED_GIT_SHA?.trim() || gitEvidence.shortSha;
  const publicStatus = await fetchPublicStatus();
  const publicDemo = withExtraIssues(
    evaluatePublicDemoStatus(publicStatus.status, { expectedGitSha }),
    publicStatus.issues,
  );
  const report: ReleaseEvidenceReport = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    expectedGitSha,
    git: gitEvidence,
    publicStatusHttp: {
      status: publicStatus.httpStatus,
      contentType: publicStatus.contentType,
    },
    publicDemo,
    commands: [
      "npm run evidence:release",
      "npm run verify:public-demo",
      "npm run release:cloud",
    ],
    notes: [
      "This command does not deploy production.",
      "Promotion pending is acceptable before explicit production approval when the public URL is healthy but serving an older SHA.",
      "Production verified requires the public URL to report the expected git SHA.",
    ],
  };
  const summary = summarizeReleaseEvidence(report);
  const markdownPath = join(outputDir, "launchlens-release-evidence.md");
  const jsonPath = join(outputDir, "launchlens-release-evidence.json");

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(markdownPath, buildReleaseEvidenceMarkdown(report), "utf8");
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        stage: summary.stage,
        label: summary.label,
        nextAction: summary.nextAction,
        markdownPath,
        jsonPath,
        baseUrl,
        expectedGitSha,
        publicGitSha: report.publicDemo.summary.gitSha,
        issues: report.publicDemo.issues,
      },
      null,
      2,
    ),
  );

  if (summary.stage === "blocked") {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Release evidence collection failed.",
  );
  process.exitCode = 1;
});
