import { configuredRealProvider } from "@/lib/launchlens/provider-runtime";
import {
  cloudStorageConfigured,
  pingCloudStorage,
} from "@/lib/launchlens/workspace-store";
import { noStoreJson } from "@/lib/launchlens/workspace-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const startTime = Date.now();

export async function GET() {
  const provider = configuredRealProvider();
  const dbConfigured = cloudStorageConfigured();

  let dbHealthy = false;
  let dbLatencyMs: number | null = null;

  if (dbConfigured) {
    const start = performance.now();
    try {
      dbHealthy = await pingCloudStorage();
    } catch {
      dbHealthy = false;
    } finally {
      dbLatencyMs = Math.round(performance.now() - start);
    }
  }

  const body = {
    status: "ok",
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0",
    provider: provider ?? "mock",
    providerConfigured: provider !== null,
    dbConfigured,
    dbHealthy,
    dbLatencyMs,
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? "development",
    uptimeSec: Math.floor((Date.now() - startTime) / 1000),
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
  };

  return noStoreJson(body, { status: 200 });
}
