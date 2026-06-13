import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { chromium } from "playwright";
import { PNG } from "pngjs";

import { diffImages, type ImageDiff } from "../src/lib/launchlens/visual-regression";

type Viewport = { name: string; width: number; height: number };

const VIEWPORTS: Viewport[] = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
  { name: "pricing", width: 1280, height: 800 },
];

const DEFAULT_TOLERANCE = 0.01;
const DEFAULT_TIMEOUT_MS = 60_000;

function readArg(name: string): string | null {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) {
    return null;
  }
  return process.argv[index + 1] ?? null;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function captureScreenshot(
  baseUrl: string,
  viewport: Viewport,
  outputPath: string,
  path: string = "/",
): Promise<void> {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(new URL(path, baseUrl).toString(), {
      waitUntil: "networkidle",
    });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);
    await page.screenshot({ path: outputPath, fullPage: false });
    await context.close();
  } finally {
    await browser.close();
  }
}

function compareImages(
  expected: string,
  actual: string,
  tolerance: number,
): ImageDiff {
  if (!existsSync(expected)) {
    throw new Error(`Baseline image not found: ${expected}`);
  }
  if (!existsSync(actual)) {
    throw new Error(`Captured image not found: ${actual}`);
  }
  const expectedPng = PNG.sync.read(readFileSync(expected));
  const actualPng = PNG.sync.read(readFileSync(actual));
  return diffImages(expectedPng, actualPng, tolerance);
}

async function main() {
  const baseUrl = readArg("url") ?? "http://127.0.0.1:3000";
  const tolerance = Number(readArg("tolerance") ?? DEFAULT_TOLERANCE);
  const updateBaseline = hasFlag("update-baseline");
  const reportPath = readArg("report");
  const baselinesDir = resolve("public/screenshots");
  const captureDir = resolve(".visual-regression");
  mkdirSync(captureDir, { recursive: true });

  const pages: Array<{ viewport: string; suffix: string; path: string }> = [
    { viewport: "desktop", suffix: "desktop", path: "/" },
    { viewport: "mobile", suffix: "mobile", path: "/" },
    { viewport: "pricing", suffix: "pricing", path: "/pricing" },
  ];

  const results: Array<{
    viewport: string;
    width: number;
    height: number;
    baseline: string;
    captured: string;
    path: string;
    diffRatio: number;
    identical: boolean;
  }> = [];

  for (const viewport of VIEWPORTS) {
    const page =
      pages.find((entry) => entry.viewport === viewport.name) ?? {
        viewport: viewport.name,
        suffix: viewport.name,
        path: "/",
      };
    const baseline = resolve(baselinesDir, `launchlens-${page.suffix}.png`);
    const captured = resolve(captureDir, `launchlens-${page.suffix}.png`);
    await captureScreenshot(baseUrl, viewport, captured, page.path);
    if (updateBaseline) {
      copyFileSync(captured, baseline);
    }
    const comparison = compareImages(baseline, captured, tolerance);
    results.push({
      viewport: viewport.name,
      width: comparison.width,
      height: comparison.height,
      baseline,
      captured,
      path: page.path,
      diffRatio: Number(comparison.diffRatio.toFixed(5)),
      identical: comparison.identical,
    });
  }

  const failed = results.filter((result) => !result.identical);
  const report = {
    baseUrl,
    tolerance,
    generatedAt: new Date().toISOString(),
    updatedBaseline: updateBaseline,
    results,
    passed: failed.length === 0,
  };

  if (reportPath) {
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  process.stderr.write(
    `Visual regression check failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
