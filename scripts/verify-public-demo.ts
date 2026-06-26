import {
  evaluatePublicDemoStatus,
  type PublicDemoStatus,
} from "../src/lib/launchlens/public-demo-verification";

const baseUrl = (
  process.env.LAUNCHLENS_BASE_URL ?? "https://launchlens-ai-two.vercel.app"
).replace(/\/$/, "");
const expectedGitSha = process.env.LAUNCHLENS_EXPECTED_GIT_SHA;

async function readStatusJson(response: Response): Promise<PublicDemoStatus> {
  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Expected LaunchLens JSON from /api/status, received ${response.status} ${contentType || "unknown content-type"}.`,
    );
  }

  try {
    return JSON.parse(text) as PublicDemoStatus;
  } catch {
    throw new Error("Expected valid JSON from /api/status.");
  }
}

async function main() {
  const response = await fetch(`${baseUrl}/api/status`, {
    headers: { accept: "application/json" },
  });

  if (response.status !== 200) {
    throw new Error(`/api/status returned HTTP ${response.status}.`);
  }

  const status = await readStatusJson(response);
  const result = evaluatePublicDemoStatus(status, { expectedGitSha });

  console.log(
    JSON.stringify(
      {
        baseUrl,
        ok: result.ok,
        ...result.summary,
        issues: result.issues,
      },
      null,
      2,
    ),
  );

  if (!result.ok) {
    throw new Error("Public demo verification failed.");
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Public demo verification failed.",
  );
  process.exitCode = 1;
});
