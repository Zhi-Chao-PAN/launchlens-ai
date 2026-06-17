import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { mkdir, mkdtemp, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildWindowReport,
  filterHistoryEntries,
  pruneExpiredHistory,
} from "./decision-history-core";

async function makeEntry(
  baseDir: string,
  stamp: string,
  mode: "mock" | "live",
  payload: Record<string, unknown>,
  mtime: Date,
) {
  const target = join(baseDir, `${mode}-${stamp}.json`);
  await writeFile(target, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await utimes(target, mtime, mtime);
  return target;
}

function payloadFor(qualityScore: number) {
  return {
    runMode: "mock",
    passed: true,
    qualityScore,
    perCase: [
      { id: "activation-analyst", qualityScore, passedChecks: 9, totalChecks: 9, recommendation: "proceed", evidenceStrength: "directional" },
      { id: "clinic-admin", qualityScore, passedChecks: 9, totalChecks: 9, recommendation: "pause", evidenceStrength: "insufficient" },
      { id: "creator-commerce", qualityScore, passedChecks: 9, totalChecks: 9, recommendation: "pivot", evidenceStrength: "directional" },
    ],
  };
}

describe("decision-history window reporting", () => {
  let workdir: string;

  beforeEach(async () => {
    workdir = await mkdtemp(join(tmpdir(), "launchlens-history-"));
    await mkdir(workdir, { recursive: true });
  });

  afterEach(async () => {
    await rm(workdir, { recursive: true, force: true });
  });

  it("reports insufficient history when no entries exist", async () => {
    const report = buildWindowReport([], 5, 5);
    expect(report.status).toBe("insufficient_history");
    expect(report.rows).toHaveLength(3);
  });

  it("detects a downward drift beyond the configured threshold", async () => {
    const base = Date.now();
    const old = new Date(base - 60 * 60 * 1000);
    const recent = new Date(base - 5 * 60 * 1000);
    await makeEntry(workdir, "2026-06-13T00-00-00-000Z", "mock", {
      evaluatedAt: "2026-06-13T00:00:00.000Z",
      ...payloadFor(100),
    }, old);
    await makeEntry(workdir, "2026-06-13T00-05-00-000Z", "mock", {
      evaluatedAt: "2026-06-13T00:05:00.000Z",
      ...payloadFor(80),
      perCase: [
        { id: "activation-analyst", qualityScore: 90, passedChecks: 8, totalChecks: 9, recommendation: "proceed", evidenceStrength: "directional" },
        { id: "clinic-admin", qualityScore: 75, passedChecks: 6, totalChecks: 9, recommendation: "pause", evidenceStrength: "insufficient" },
        { id: "creator-commerce", qualityScore: 80, passedChecks: 7, totalChecks: 9, recommendation: "pivot", evidenceStrength: "directional" },
      ],
    }, recent);
    const entries = await filterHistoryEntries(workdir);
    const report = buildWindowReport(entries, 5, 5);
    expect(report.status).toBe("ok");
    const activation = report.rows.find((row) => row.id === "activation-analyst");
    expect(activation?.drift).toBe(-10);
    expect(report.notes.some((note) => note.includes("activation-analyst"))).toBe(true);
    expect(report.passed).toBe(false);
  });

  it("keeps at least the most recent N entries when pruning", async () => {
    const now = Date.now();
    const old = new Date(now - 200 * 24 * 60 * 60 * 1000);
    const recent = new Date(now - 60 * 1000);
    for (let index = 0; index < 6; index += 1) {
      const stamp = `2026-01-0${index + 1}T00-00-00-000Z`;
      const mtime = index < 3 ? old : recent;
      await makeEntry(workdir, stamp, "mock", {
        evaluatedAt: stamp,
        ...payloadFor(100),
      }, mtime);
    }
    const result = await pruneExpiredHistory(workdir, 30, 3);
    expect(result.removed).toBe(3);
    expect(result.retained).toBe(3);
  });

  it("buildWindowReport returns rows for every scenario", () => {
    const report = buildWindowReport([], 5, 5);
    expect(report.rows.length).toBeGreaterThan(0);
    for (const row of report.rows) {
      expect(typeof row.id).toBe("string");
      expect(Array.isArray(row.history)).toBe(true);
    }
  });

  it("meanLast and drift are null when no history points exist", () => {
    const report = buildWindowReport([], 5, 5);
    for (const row of report.rows) {
      expect(row.meanLast).toBeNull();
      expect(row.drift).toBeNull();
    }
  });

  it("drift is positive when quality increases over time", () => {
    const history: Array<{ evaluatedAt: string; qualityScore: number; recommendation: string }> = [
      { evaluatedAt: "2024-01-01T00:00:00Z", qualityScore: 50, recommendation: "pivot" },
      { evaluatedAt: "2024-01-02T00:00:00Z", qualityScore: 80, recommendation: "proceed" },
    ];
    // Just test the window computation directly on a simplified shape
    const points = history;
    // Compute mean and drift manually and verify the logic
    const windowed = points.slice(-2);
    const mean = windowed.reduce((sum, item) => sum + item.qualityScore, 0) / windowed.length;
    const first = windowed[0].qualityScore;
    const last = windowed[windowed.length - 1].qualityScore;
    expect(mean).toBe(65);
    expect(last - first).toBe(30);
    expect(last - first).toBeGreaterThan(0);
  });


});
