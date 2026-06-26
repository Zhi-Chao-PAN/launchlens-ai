export type PublicDemoStatus = {
  status?: unknown;
  dbConfigured?: unknown;
  dbHealthy?: unknown;
  gitSha?: unknown;
  vercelEnv?: unknown;
};

export type PublicDemoVerificationOptions = {
  expectedGitSha?: string;
};

export type PublicDemoVerificationResult = {
  ok: boolean;
  issues: string[];
  summary: {
    gitSha: string | null;
    vercelEnv: string | null;
    dbConfigured: boolean;
    dbHealthy: boolean;
  };
};

function normalizedExpectedSha(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function evaluatePublicDemoStatus(
  status: PublicDemoStatus,
  options: PublicDemoVerificationOptions = {},
): PublicDemoVerificationResult {
  const issues: string[] = [];
  const gitSha = typeof status.gitSha === "string" ? status.gitSha : null;
  const vercelEnv =
    typeof status.vercelEnv === "string" ? status.vercelEnv : null;
  const dbConfigured = status.dbConfigured === true;
  const dbHealthy = status.dbHealthy === true;
  const expectedGitSha = normalizedExpectedSha(options.expectedGitSha);

  if (status.status !== "ok") {
    issues.push("Status endpoint did not report status=ok.");
  }

  if (!dbConfigured) {
    issues.push("Public demo database is not configured.");
  }

  if (!dbHealthy) {
    issues.push("Public demo database health check failed.");
  }

  if (!gitSha) {
    issues.push("Status endpoint did not include a gitSha.");
  } else if (expectedGitSha && !gitSha.startsWith(expectedGitSha)) {
    issues.push(
      `Public demo gitSha ${gitSha} does not match expected ${expectedGitSha}.`,
    );
  }

  return {
    ok: issues.length === 0,
    issues,
    summary: {
      gitSha,
      vercelEnv,
      dbConfigured,
      dbHealthy,
    },
  };
}
