import { mkdir, readdir, readFile, stat, unlink } from "node:fs/promises";
import { resolve } from "node:path";

export type DecisionHistoryScenarioId =
  | "activation-analyst"
  | "clinic-admin"
  | "creator-commerce";

export type DecisionHistoryEntry = {
  evaluatedAt: string;
  runMode: "mock" | "live";
  passed: boolean;
  qualityScore: number;
  perCase: Array<{
    id: DecisionHistoryScenarioId;
    qualityScore: number;
    passedChecks: number;
    totalChecks: number;
    recommendation: string;
    evidenceStrength: string;
  }>;
};

export type DecisionHistoryRow = {
  id: DecisionHistoryScenarioId;
  history: Array<{ evaluatedAt: string; qualityScore: number; recommendation: string }>;
  meanLast: number | null;
  drift: number | null;
};

export type DecisionHistoryReport = {
  status: "ok" | "insufficient_history";
  windowSize: number;
  driftThreshold: number;
  rows: DecisionHistoryRow[];
  latestEvaluatedAt: string | null;
  passed: boolean | null;
  notes: string[];
};

export const DECISION_HISTORY_SCENARIO_IDS: DecisionHistoryScenarioId[] = [
  "activation-analyst",
  "clinic-admin",
  "creator-commerce",
];

export async function filterHistoryEntries(
  directory: string,
): Promise<DecisionHistoryEntry[]> {
  await mkdir(directory, { recursive: true });
  const files = (await readdir(directory))
    .filter((name) => name.endsWith(".json"))
    .sort();
  const entries: DecisionHistoryEntry[] = [];
  for (const file of files) {
    const raw = await readFile(resolve(directory, file), "utf8");
    try {
      const parsed = JSON.parse(raw) as DecisionHistoryEntry;
      if (parsed && Array.isArray(parsed.perCase)) {
        entries.push(parsed);
      }
    } catch {
      // skip malformed history file
    }
  }
  return entries;
}

export async function pruneExpiredHistory(
  directory: string,
  maxAgeDays: number,
  minKeep: number,
) {
  const files = (await readdir(directory))
    .filter((name) => name.endsWith(".json"))
    .sort();
  if (files.length <= minKeep) {
    return { removed: 0, retained: files.length };
  }
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const keepTail = new Set(files.slice(files.length - minKeep));
  const remaining: string[] = [];
  for (const file of files) {
    const filePath = resolve(directory, file);
    if (keepTail.has(file)) {
      remaining.push(file);
      continue;
    }
    const stats = await stat(filePath);
    if (stats.mtimeMs < cutoff) {
      await unlink(filePath);
      continue;
    }
    remaining.push(file);
  }
  return {
    removed: files.length - remaining.length,
    retained: remaining.length,
  };
}

export function buildWindowReport(
  entries: DecisionHistoryEntry[],
  windowSize: number,
  driftThreshold: number,
): DecisionHistoryReport {
  if (entries.length === 0) {
    return {
      status: "insufficient_history",
      windowSize,
      driftThreshold,
      rows: DECISION_HISTORY_SCENARIO_IDS.map((id) => ({
        id,
        history: [],
        meanLast: null,
        drift: null,
      })),
      latestEvaluatedAt: null,
      passed: null,
      notes: ["No decision eval history files found."],
    };
  }
  const slice = entries.slice(-windowSize);
  const rows: DecisionHistoryRow[] = DECISION_HISTORY_SCENARIO_IDS.map((id) => {
    const history = entries
      .map((entry) => {
        const perCase = entry.perCase.find((item) => item.id === id);
        if (!perCase) {
          return null;
        }
        return {
          evaluatedAt: entry.evaluatedAt,
          qualityScore: perCase.qualityScore,
          recommendation: perCase.recommendation,
        };
      })
      .filter(
        (point): point is { evaluatedAt: string; qualityScore: number; recommendation: string } =>
          point !== null,
      );
    const windowed = slice
      .map((entry) => entry.perCase.find((item) => item.id === id))
      .filter((item): item is DecisionHistoryEntry["perCase"][number] => Boolean(item));
    if (windowed.length === 0) {
      return { id, history, meanLast: null, drift: null };
    }
    const meanLast =
      windowed.reduce((sum, item) => sum + item.qualityScore, 0) /
      windowed.length;
    const firstScore = windowed[0].qualityScore;
    const lastScore = windowed[windowed.length - 1].qualityScore;
    const drift = lastScore - firstScore;
    return { id, history, meanLast, drift };
  });
  const notes: string[] = [];
  for (const row of rows) {
    if (row.drift === null) {
      continue;
    }
    if (row.drift < -driftThreshold) {
      notes.push(
        `Drift detected for ${row.id}: ${row.drift} over the last ${slice.length} runs.`,
      );
    }
  }
  const lastEntry = slice[slice.length - 1];
  return {
    status: "ok",
    windowSize,
    driftThreshold,
    rows,
    latestEvaluatedAt: lastEntry.evaluatedAt,
    passed: notes.length === 0,
    notes,
  };
}
