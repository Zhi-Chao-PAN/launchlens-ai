import { spawnSync } from "node:child_process";

const baseUrl = (
  process.env.LAUNCHLENS_BASE_URL ?? "https://launchlens-ai-two.vercel.app"
).replace(/\/$/, "");
const expectedGitSha = process.env.LAUNCHLENS_EXPECTED_GIT_SHA;

function runCommand(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
): number {
  const isWindows = process.platform === "win32";
  const executable = isWindows ? (process.env.ComSpec ?? "cmd.exe") : command;
  const commandArgs = isWindows
    ? ["/d", "/s", "/c", command, ...args]
    : args;
  const result = spawnSync(executable, commandArgs, {
    stdio: "inherit",
    shell: false,
    windowsHide: true,
    env,
  });

  if (typeof result.status === "number") {
    return result.status;
  }

  if (result.error) {
    console.error(result.error.message);
  }

  return 1;
}

function commandEnv(extra: NodeJS.ProcessEnv = {}) {
  return {
    ...process.env,
    LAUNCHLENS_BASE_URL: baseUrl,
    ...(expectedGitSha ? { LAUNCHLENS_EXPECTED_GIT_SHA: expectedGitSha } : {}),
    ...extra,
  };
}

console.log(
  JSON.stringify(
    {
      baseUrl,
      expectedGitSha: expectedGitSha ?? null,
      checks: ["verify:public-demo", "playwright-production-e2e"],
    },
    null,
    2,
  ),
);

const publicDemoStatus = runCommand(
  "npm",
  ["run", "verify:public-demo"],
  commandEnv(),
);

if (publicDemoStatus !== 0) {
  process.exitCode = publicDemoStatus;
} else {
  process.exitCode = runCommand(
    "npx",
    ["playwright", "test"],
    commandEnv({
      PLAYWRIGHT_BASE_URL: baseUrl,
      PLAYWRIGHT_NO_WEBSERVER: "1",
    }),
  );
}
