import { configuredRealProvider } from "@/lib/launchlens/provider-runtime";
import {
  cloudStorageConfigured,
  pingCloudStorage,
} from "@/lib/launchlens/workspace-store";
import { noStoreJson, startTimer } from "@/lib/launchlens/workspace-api";
import packageJson from "../../../../package.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const startTime = Date.now();
const appVersion = packageJson.version;

export async function GET() {
  const totalTimer = startTimer();
  const provider = configuredRealProvider();
  const dbConfigured = cloudStorageConfigured();

  let dbHealthy = false;
  let dbLatencyMs: number | null = null;

  const dbTimer = startTimer();
  if (dbConfigured) {
    try {
      dbHealthy = await pingCloudStorage();
    } catch {
      dbHealthy = false;
    } finally {
      dbLatencyMs = dbTimer();
    }
  }

  const body = {
    status: "ok",
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? appVersion,
    provider: provider ?? "mock",
    providerConfigured: provider !== null,
    dbConfigured,
    dbHealthy,
    dbLatencyMs,
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? "development",
    uptimeSec: Math.floor((Date.now() - startTime) / 1000),
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
    responseTimeMs: totalTimer(),
  };

  return noStoreJson(body, { status: 200 }, undefined, totalTimer());
}
