import { generateLaunchWorkspace } from "@/lib/launchlens/provider";
import type { LaunchLensInput } from "@/lib/launchlens/types";

export const runtime = "nodejs";

function field(value: unknown) {
  return typeof value === "string" ? value : "";
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

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const input = normalize(body);

  if (input.idea.trim().length < 12) {
    return Response.json(
      { error: "Please provide a product idea with at least 12 characters." },
      { status: 400 },
    );
  }

  const result = await generateLaunchWorkspace(input);
  return Response.json(result);
}
