import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { exampleWorkspaces } from "@/lib/launchlens/example-workspaces";

import { POST, resetDecisionRateLimitsForTests } from "./route";

const sample = exampleWorkspaces[0].execution.experiments[0];

describe("/api/decision", () => {
  beforeEach(() => {
    delete process.env.MINIMAX_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.DECISION_COPILOT_LIVE_ENABLED;
    resetDecisionRateLimitsForTests();
  });

  afterEach(() => {
    delete process.env.MINIMAX_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.DECISION_COPILOT_LIVE_ENABLED;
    resetDecisionRateLimitsForTests();
  });

  function postExperiment(experiment: unknown) {
    return POST(
      new Request("http://localhost/api/decision", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ experiment }),
      }),
    );
  }

  it("rejects non-JSON payloads with 400", async () => {
    const response = await POST(
      new Request("http://localhost/api/decision", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "not-json",
      }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects empty experiments with 422 because no evidence is available", async () => {
    const response = await postExperiment({
      id: "empty-experiment",
      assumption: "No evidence yet.",
      status: "testing",
      confidence: "low",
      evidence: [],
    });
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("evidence"),
    });
  });

  it("returns a decision brief for a well-formed experiment", async () => {
    const response = await postExperiment({ ...sample, experimentId: sample.id });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = (await response.json()) as Record<string, unknown>;
    const brief = (body.brief ?? {}) as Record<string, unknown>;
    expect(typeof brief.recommendation).toBe("string");
    expect(Array.isArray(brief.groundedClaims ?? brief.claims)).toBe(true);
    expect(body.mode).toBe("demo");
  });
});
