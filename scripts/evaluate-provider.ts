import { randomUUID } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  assertSafeProviderFixture,
  buildProviderEvalCase,
  buildProviderEvalFixture,
  providerEvalSummary,
  PUBLIC_PROVIDER_EVAL_SCENARIO_IDS,
  type ProviderEvalCase,
} from "../src/lib/launchlens/provider-eval";
import { generateLaunchWorkspace } from "../src/lib/launchlens/provider";
import { sampleBriefs } from "../src/lib/launchlens/sample-briefs";

async function main() {
  const args = new Set(process.argv.slice(2));
  const isLive = args.has("--live");
  const shouldWriteFixture = args.has("--write-fixture");
  const fixturePath = resolve(
    process.cwd(),
    "fixtures/providers/minimax-m3-public-samples.json",
  );

  if (shouldWriteFixture && !isLive) {
    throw new Error(
      "Writing a MiniMax fixture requires the explicit --live flag.",
    );
  }

  if (
    process.env.CI === "true" &&
    isLive &&
    process.env.ALLOW_LIVE_PROVIDER_EVAL !== "1"
  ) {
    throw new Error("Live provider evaluation is disabled in standard CI.");
  }

  if (!isLive) {
    delete process.env.MINIMAX_API_KEY;
    delete process.env.MINIMAX_BASE_URL;
    delete process.env.MINIMAX_MODEL;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.OPENAI_MODEL;
  }

  if (isLive && !process.env.MINIMAX_API_KEY) {
    throw new Error(
      "MINIMAX_API_KEY is required for --live provider evaluation.",
    );
  }

  const publicSamples = PUBLIC_PROVIDER_EVAL_SCENARIO_IDS.map((id) => {
    const sample = sampleBriefs.find((candidate) => candidate.id === id);

    if (!sample) {
      throw new Error(`Public provider eval scenario is missing: ${id}`);
    }

    return {
      ...sample,
      id,
    };
  });
  const cases: ProviderEvalCase[] = [];

  for (const sample of publicSamples) {
    const startedAt = performance.now();
    const result = await generateLaunchWorkspace(sample.input);
    const evalCase = buildProviderEvalCase(
      sample.id,
      result,
      performance.now() - startedAt,
    );

    cases.push(evalCase);
  }

  if (isLive) {
    const failedCase = cases.find(
      (evalCase) =>
        evalCase.mode !== "real" ||
        evalCase.provider !== "minimax" ||
        evalCase.usedFallback ||
        evalCase.qualityScore < 90 ||
        evalCase.scenarioChecks.some((check) => !check.passed),
    );

    if (failedCase) {
      process.exitCode = 1;
    }
  }

  if (shouldWriteFixture && process.exitCode !== 1) {
    const fixture = buildProviderEvalFixture({
      model: process.env.MINIMAX_MODEL ?? "MiniMax-M3",
      evaluatedAt: new Date().toISOString(),
      cases,
    });
    const temporaryPath = `${fixturePath}.${randomUUID()}.tmp`;

    assertSafeProviderFixture(fixture, [
      process.env.MINIMAX_API_KEY ?? "",
      process.env.OPENAI_API_KEY ?? "",
    ]);
    await mkdir(dirname(fixturePath), { recursive: true });
    await writeFile(
      temporaryPath,
      `${JSON.stringify(fixture, null, 2)}\n`,
      "utf8",
    );
    await rename(temporaryPath, fixturePath);
  }

  console.log(
    JSON.stringify(
      {
        runMode: isLive ? "live" : "mock",
        passed: process.exitCode !== 1,
        fixtureWritten: shouldWriteFixture && process.exitCode !== 1,
        cases: cases.map(providerEvalSummary),
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Provider evaluation failed.",
  );
  process.exitCode = 1;
});
