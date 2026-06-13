import { mkdir, readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const HISTORY_DIR = resolve(
  process.cwd(),
  "fixtures/providers/decision-history",
);

async function readEntries(): Promise<unknown[]> {
  await mkdir(HISTORY_DIR, { recursive: true });
  const files = (await readdir(HISTORY_DIR))
    .filter((name) => name.endsWith(".json"))
    .sort();
  const entries: unknown[] = [];

  for (const file of files) {
    const raw = await readFile(resolve(HISTORY_DIR, file), "utf8");
    entries.push(JSON.parse(raw));
  }

  return entries;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const compareMode = args.has("--compare");

  if (!compareMode) {
    throw new Error("decision-history currently only supports --compare");
  }

  const entries = (await readEntries()) as Array<{
    evaluatedAt: string;
    runMode: string;
    passed: boolean;
    qualityScore: number;
    perCase: Array<{
      id: string;
      qualityScore: number;
      passedChecks: number;
      totalChecks: number;
      recommendation: string;
      evidenceStrength: string;
    }>;
  }>;

  if (entries.length < 2) {
    process.stdout.write(
      `${JSON.stringify({ status: "insufficient_history", entries: entries.length })}\n`,
    );
    return;
  }

  const previous = entries[entries.length - 2];
  const latest = entries[entries.length - 1];
  const deltas = {
    qualityScore: latest.qualityScore - previous.qualityScore,
    passed: latest.passed === previous.passed,
  };
  const perCase = latest.perCase.map((next) => {
    const prev = previous.perCase.find((candidate) => candidate.id === next.id);
    return {
      id: next.id,
      qualityDelta: prev ? next.qualityScore - prev.qualityScore : null,
      recommendationChanged: prev
        ? prev.recommendation !== next.recommendation
        : null,
    };
  });
  const report = {
    status: "ok",
    previous: previous.evaluatedAt,
    latest: latest.evaluatedAt,
    deltas,
    perCase,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(
    `Decision history failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});

