import { generateLaunchWorkspace } from "@/lib/launchlens/provider";
import type { LaunchLensInput } from "@/lib/launchlens/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_CONTENT_LENGTH = 10_000;
const MAX_FIELD_LENGTH = 1_200;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;
const rateLimitBuckets = new Map<string, number[]>();

function field(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalize(body: unknown): LaunchLensInput {
  const record =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  return {
    idea: field(record.idea),
    audience: field(record.audience),
    market: field(record.market),
    tone: field(record.tone),
    constraints: field(record.constraints),
  };
}

function validateInput(input: LaunchLensInput) {
  if (input.idea.length < 12) {
    return "Please provide a product idea with at least 12 characters.";
  }

  const entries = Object.entries(input) as Array<[keyof LaunchLensInput, string]>;
  const longField = entries.find(([, value]) => value.length > MAX_FIELD_LENGTH);

  if (longField) {
    return `${longField[0]} must be ${MAX_FIELD_LENGTH} characters or less.`;
  }

  return "";
}

function clientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0];
  return (
    forwardedFor?.trim() ||
    request.headers.get("x-real-ip") ||
    "local-demo-client"
  );
}

function rateLimit(request: Request) {
  const key = clientKey(request);
  const now = Date.now();
  const recent = (rateLimitBuckets.get(key) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitBuckets.set(key, recent);
    return false;
  }

  recent.push(now);
  rateLimitBuckets.set(key, recent);
  return true;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (contentLength > MAX_CONTENT_LENGTH) {
    return Response.json(
      { error: "Request body is too large for the demo endpoint." },
      { status: 413 },
    );
  }

  if (!rateLimit(request)) {
    return Response.json(
      { error: "Too many generation requests. Please try again in a minute." },
      { status: 429 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const input = normalize(body);
  const inputError = validateInput(input);

  if (inputError) {
    return Response.json({ error: inputError }, { status: 400 });
  }

  const result = await generateLaunchWorkspace(input);
  return Response.json(result);
}
