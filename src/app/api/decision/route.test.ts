import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { exampleWorkspaces } from "@/lib/launchlens/example-workspaces";
import { decisionSourceFromExperiment } from "@/lib/launchlens/decision";

import { POST, resetDecisionRateLimitsForTests } from "./route";

describe("POST /api/decision", () => {
  const source = decisionSourceFromExperiment(
    exampleWorkspaces[0].execution.experiments[0],
  );

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.MINIMAX_API_KEY;
    resetDecisionRateLimitsForTests();
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.MINIMAX_API_KEY;
  });

  it("returns a demo decision brief without an API key", async () => {
    const response = await POST(
      new Request("http://localhost/api/decision", {
        method: "POST",
        body: JSON.stringify({ experiment: source }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.mode).toBe("demo");
    expect(body.brief.provider).toBe("mock");
    expect(
      body.brief.claims.flatMap(
        (claim: { evidenceIds: string[] }) => claim.evidenceIds,
      ),
    ).toEqual(
      source.evidence.map((item) => item.id),
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects experiments without evidence", async () => {
    const response = await POST(
      new Request("http://localhost/api/decision", {
        method: "POST",
        body: JSON.stringify({
          experiment: { ...source, evidence: [] },
        }),
      }),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("evidence"),
    });
  });

  it("rejects oversized chunked request bodies", async () => {
    const response = await POST(
      new Request("http://localhost/api/decision", {
        method: "POST",
        body: JSON.stringify({ padding: "x".repeat(40_001) }),
      }),
    );

    expect(response.status).toBe(413);
  });
});
