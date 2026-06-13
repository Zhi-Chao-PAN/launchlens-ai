import { randomUUID } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  assertSafeDecisionFixture,
  buildDecisionEvalCase,
  buildDecisionEvalFixture,
  decisionEvalSummary,
  PUBLIC_DECISION_EVAL_SCENARIO_IDS,
  type DecisionEvalCase,
} from "../src/lib/launchlens/decision-eval";
import { decisionSourceFromExperiment } from "../src/lib/launchlens/decision";
import { generateDecisionBrief } from "../src/lib/launchlens/decision-provider";
import { exampleWorkspaces } from "../src/lib/launchlens/example-workspaces";

function evalCasePassed(evalCase: DecisionEvalCase, isLive: boolean) {
  return (
    evalCase.qualityScore >= 90 &&
    evalCase.scenarioChecks.every((check) => check.passed) &&
    (!isLive ||
      (evalCase.mode === "real" &&
        evalCase.provider === "minimax" &&
        !evalCase.usedFallback))
  );
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const isLive = args.has("--live");
  const shouldWriteFixture = args.has("--write-fixture");
  const fixturePath = resolve(
    process.cwd(),
    "fixtures/providers/minimax-m3-decision-samples.json",
  );

  if (shouldWriteFixture && !isLive) {
    throw new Error(
      "Writing a MiniMax decision fixture requires the explicit --live flag.",
    );
  }

  if (
    process.env.CI === "true" &&
    isLive &&
    process.env.ALLOW_LIVE_DECISION_EVAL !== "1"
  ) {
    throw new Error("Live decision evaluation is disabled in standard CI.");
  }

  if (!isLive) {
    delete process.env.MINIMAX_API_KEY;
    delete process.env.MINIMAX_BASE_URL;
    delete process.env.MINIMAX_MODEL;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.OPENAI_MODEL;
    delete process.env.DECISION_COPILOT_LIVE_ENABLED;
  }

  if (isLive && !process.env.MINIMAX_API_KEY) {
    throw new Error(
      "MINIMAX_API_KEY is required for --live decision evaluation.",
    );
  }

  if (isLive) {
    process.env.DECISION_COPILOT_LIVE_ENABLED = "true";
  }

  const sources = PUBLIC_DECISION_EVAL_SCENARIO_IDS.map((id) => {
    const example = exampleWorkspaces.find((candidate) => candidate.id === id);
    const experiment = example?.execution.experiments.find(
      (candidate) => candidate.evidence.length > 0,
    );

    if (!experiment) {
      throw new Error(`Decision eval scenario is missing evidence: ${id}`);
    }

    return {
      id,
      source: decisionSourceFromExperiment(experiment),
    };
  });
  const cases: DecisionEvalCase[] = [];
  const maxAttempts = isLive ? 2 : 1;

  for (const item of sources) {
    let evalCase: DecisionEvalCase | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const startedAt = performance.now();
      const result = await generateDecisionBrief(item.source);

      evalCase = buildDecisionEvalCase(
        item.id,
        item.source,
        result,
        performance.now() - startedAt,
      );

      if (evalCasePassed(evalCase, isLive)) {
        break;
      }
    }

    if (!evalCase) {
      throw new Error(`Decision eval case did not run: ${item.id}`);
    }

    cases.push(evalCase);
  }

  const failedCase = cases.find((evalCase) => !evalCasePassed(evalCase, isLive));

  if (failedCase) {
    process.exitCode = 1;
  }

  if (shouldWriteFixture && process.exitCode !== 1) {
    const fixture = buildDecisionEvalFixture({
      model: process.env.MINIMAX_MODEL ?? "MiniMax-M3",
      evaluatedAt: new Date().toISOString(),
      cases,
    });
    const temporaryPath = `${fixturePath}.${randomUUID()}.tmp`;

    assertSafeDecisionFixture(fixture, [
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
        cases: cases.map(decisionEvalSummary),
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Decision evaluation failed.",
  );
  process.exitCode = 1;
});
