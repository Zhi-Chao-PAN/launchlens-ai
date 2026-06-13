import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  buildWindowReport,
  filterHistoryEntries,
  pruneExpiredHistory,
  type DecisionHistoryEntry,
  type DecisionHistoryReport,
} from "../src/lib/launchlens/decision-history-core";

const HISTORY_DIR = resolve(
  process.cwd(),
  "fixtures/providers/decision-history",
);
const DEFAULT_DASHBOARD_PATH = resolve(
  process.cwd(),
  "docs/decision-dashboard.html",
);
const DEFAULT_RETENTION_MAX_AGE_DAYS = 90;
const DEFAULT_RETENTION_MIN_KEEP = 10;
const DEFAULT_WINDOW_SIZE = 5;
const DEFAULT_DRIFT_THRESHOLD = 5;

function gitShortSha(): string | null {
  const result = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (result.status !== 0) {
    return null;
  }
  return result.stdout.trim() || null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderDashboard(
  entries: DecisionHistoryEntry[],
  report: DecisionHistoryReport,
): string {
  const generatedAt = new Date().toISOString();
  const lastEntry = entries[entries.length - 1];
  const summary = lastEntry
    ? `<p class="lede">Latest run: <strong>${escapeHtml(lastEntry.runMode)}</strong> on ${escapeHtml(lastEntry.evaluatedAt)} with quality ${lastEntry.qualityScore} (${lastEntry.passed ? "pass" : "fail"}).</p>`
    : "<p class=\"lede\">No history yet. Run <code>npm run eval:decision -- --write-history</code> to seed it.</p>";
  const rows = report.rows
    .map((row) => {
      const series = row.history
        .map(
          (point) =>
            `<tr><td>${escapeHtml(point.evaluatedAt)}</td><td>${point.qualityScore}</td><td>${escapeHtml(point.recommendation)}</td></tr>`,
        )
        .join("");
      const driftLabel = row.drift === null ? "n/a" : `${row.drift >= 0 ? "+" : ""}${row.drift}`;
      return `
        <section class="scenario">
          <h2>${escapeHtml(row.id)}</h2>
          <p class="meta">Mean of last ${report.windowSize} runs: <strong>${row.meanLast?.toFixed(1) ?? "n/a"}</strong>. Drift: <strong>${driftLabel}</strong> (threshold ${report.driftThreshold}).</p>
          <table>
            <thead><tr><th>Evaluated at</th><th>Quality</th><th>Recommendation</th></tr></thead>
            <tbody>${series}</tbody>
          </table>
        </section>`;
    })
    .join("");
  const notes = report.notes.length
    ? `<ul class="notes">${report.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>`
    : "<p class=\"notes\">No drift beyond the configured threshold.</p>";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>LaunchLens AI - Decision Eval Dashboard</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; background: #f6f8f4; color: #17201d; margin: 0; padding: 2rem 1.5rem; }
  main { max-width: 920px; margin: 0 auto; }
  h1 { margin: 0 0 0.5rem; font-size: 1.6rem; }
  p.lede { color: #40504a; margin: 0 0 1.5rem; }
  p.meta { color: #40504a; margin: 0.25rem 0 0.75rem; font-size: 0.95rem; }
  .pill { display: inline-block; padding: 0.15rem 0.55rem; border-radius: 0.4rem; font-size: 0.8rem; font-weight: 600; }
  .pill.pass { background: #d4f0e1; color: #0f6b4a; }
  .pill.fail { background: #f6df8f; color: #6a4a08; }
  .scenario { background: #ffffff; border: 1px solid #d8ded4; border-radius: 0.6rem; padding: 1rem 1.25rem; margin: 1rem 0; }
  .scenario h2 { margin: 0 0 0.25rem; font-size: 1.1rem; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  th, td { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 1px solid #eef0eb; }
  th { background: #fbfcfa; }
  ul.notes { margin: 1rem 0 0; padding-left: 1.25rem; color: #8b3d28; }
  code { background: #fbfcfa; padding: 0.1rem 0.35rem; border-radius: 0.3rem; }
</style>
</head>
<body>
<main>
  <h1>LaunchLens AI decision-eval retention</h1>
  ${summary}
  <p class="meta">Total runs on file: <strong>${entries.length}</strong>. Window: <strong>${report.windowSize}</strong>. Drift threshold: <strong>${report.driftThreshold}</strong>. Generated at <code>${escapeHtml(generatedAt)}</code>.</p>
  ${rows}
  ${notes}
  <p class="meta">Read <code>docs/decision-dashboard.html</code> from a fresh clone to verify retention. Source files live in <code>fixtures/providers/decision-history/</code> and are committed to the repository so the dashboard is fully reproducible.</p>
</main>
</body>
</html>
`;
}

function readPositiveIntArg(name: string, fallback: number): number {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) {
    return fallback;
  }
  const value = Number(process.argv[index + 1]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function readStringArg(name: string, fallback: string): string {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) {
    return fallback;
  }
  return process.argv[index + 1] ?? fallback;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const compareMode = args.has("--compare");
  const windowMode = args.has("--window");
  const dashboardMode = args.has("--dashboard");
  const pruneMode = args.has("--prune");
  const sha = gitShortSha();

  if (pruneMode) {
    const maxAgeDays = readPositiveIntArg(
      "max-age-days",
      DEFAULT_RETENTION_MAX_AGE_DAYS,
    );
    const minKeep = readPositiveIntArg("min-keep", DEFAULT_RETENTION_MIN_KEEP);
    const result = await pruneExpiredHistory(HISTORY_DIR, maxAgeDays, minKeep);
    process.stdout.write(
      `${JSON.stringify({ status: "pruned", sha, ...result, maxAgeDays, minKeep }, null, 2)}\n`,
    );
    return;
  }

  const entries = await filterHistoryEntries(HISTORY_DIR);
  const windowSize = readPositiveIntArg("size", DEFAULT_WINDOW_SIZE);
  const driftThreshold = readPositiveIntArg(
    "drift-threshold",
    DEFAULT_DRIFT_THRESHOLD,
  );

  if (dashboardMode) {
    const report = buildWindowReport(entries, windowSize, driftThreshold);
    const html = renderDashboard(entries, report);
    const outputPath = resolve(
      process.cwd(),
      readStringArg("out", "docs/decision-dashboard.html"),
    );
    await mkdir(resolve(outputPath, ".."), { recursive: true });
    await writeFile(outputPath, html, "utf8");
    process.stdout.write(
      `${JSON.stringify({ status: "dashboard_written", path: outputPath, sha, totalEntries: entries.length, windowReport: report }, null, 2)}\n`,
    );
    return;
  }

  if (windowMode || compareMode) {
    const report = buildWindowReport(entries, windowSize, driftThreshold);
    process.stdout.write(
      `${JSON.stringify({ status: report.status, sha, totalEntries: entries.length, report }, null, 2)}\n`,
    );
    if (report.status === "ok" && report.passed === false) {
      process.exitCode = 1;
    }
    return;
  }

  throw new Error(
    "decision-history requires one of --compare, --window, --dashboard, or --prune",
  );
}

main().catch((error) => {
  process.stderr.write(
    `Decision history failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
