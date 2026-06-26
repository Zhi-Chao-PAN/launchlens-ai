import type { PublicDemoVerificationResult } from "./public-demo-verification";

export type ReleaseEvidenceStage =
  | "production_verified"
  | "promotion_pending"
  | "blocked";

export type GitReleaseEvidence = {
  branch: string;
  headSha: string;
  shortSha: string;
  upstream: string | null;
  ahead: number | null;
  dirty: boolean;
  remoteUrl: string | null;
};

export type ReleaseEvidenceReport = {
  generatedAt: string;
  baseUrl: string;
  expectedGitSha: string;
  git: GitReleaseEvidence;
  publicStatusHttp: {
    status: number | null;
    contentType: string | null;
  };
  publicDemo: PublicDemoVerificationResult;
  commands: string[];
  notes: string[];
};

export type ReleaseEvidenceSummary = {
  stage: ReleaseEvidenceStage;
  label: string;
  nextAction: string;
};

function isShaMismatchOnly(result: PublicDemoVerificationResult) {
  return (
    result.issues.length > 0 &&
    result.issues.every((issue) => issue.includes("does not match expected")) &&
    result.summary.gitSha !== null &&
    result.summary.dbConfigured &&
    result.summary.dbHealthy
  );
}

export function summarizeReleaseEvidence(
  report: ReleaseEvidenceReport,
): ReleaseEvidenceSummary {
  if (report.git.dirty) {
    return {
      stage: "blocked",
      label: "Local tree has uncommitted changes",
      nextAction:
        "Commit, stash, or discard local changes before treating this evidence as release-ready.",
    };
  }

  if (report.publicDemo.ok) {
    return {
      stage: "production_verified",
      label: "Production is serving the expected commit",
      nextAction:
        "Attach this evidence to the release note and keep the post-promotion workflow run URL.",
    };
  }

  if (isShaMismatchOnly(report.publicDemo)) {
    return {
      stage: "promotion_pending",
      label: "Production is healthy but still serving a different commit",
      nextAction:
        "Promote the current RC only after explicit production approval, then rerun the cloud release gate.",
    };
  }

  return {
    stage: "blocked",
    label: "Public demo verification failed",
    nextAction:
      "Fix the public status, database health, or target URL before promotion.",
  };
}

function yesNo(value: boolean) {
  return value ? "yes" : "no";
}

function maybe(value: string | number | null) {
  return value === null ? "unknown" : String(value);
}

function renderIssues(issues: string[]) {
  if (issues.length === 0) {
    return "- none";
  }

  return issues.map((issue) => `- ${issue}`).join("\n");
}

export function buildReleaseEvidenceMarkdown(
  report: ReleaseEvidenceReport,
): string {
  const summary = summarizeReleaseEvidence(report);

  return `# LaunchLens AI Release Evidence

Generated: ${report.generatedAt}

## Result

- Stage: ${summary.stage}
- Summary: ${summary.label}
- Next action: ${summary.nextAction}

## Git

- Branch: ${report.git.branch}
- Head SHA: ${report.git.headSha}
- Short SHA: ${report.git.shortSha}
- Upstream: ${maybe(report.git.upstream)}
- Ahead of upstream: ${maybe(report.git.ahead)}
- Dirty working tree: ${yesNo(report.git.dirty)}
- Remote: ${maybe(report.git.remoteUrl)}

## Public Demo

- Base URL: ${report.baseUrl}
- HTTP status: ${maybe(report.publicStatusHttp.status)}
- Content type: ${maybe(report.publicStatusHttp.contentType)}
- Expected git SHA: ${report.expectedGitSha}
- Reported git SHA: ${maybe(report.publicDemo.summary.gitSha)}
- Vercel env: ${maybe(report.publicDemo.summary.vercelEnv)}
- Database configured: ${yesNo(report.publicDemo.summary.dbConfigured)}
- Database healthy: ${yesNo(report.publicDemo.summary.dbHealthy)}
- Gate ok: ${yesNo(report.publicDemo.ok)}

## Issues

${renderIssues(report.publicDemo.issues)}

## Evidence Commands

${report.commands.map((command) => `- \`${command}\``).join("\n")}

## Notes

${report.notes.map((note) => `- ${note}`).join("\n")}
`;
}
