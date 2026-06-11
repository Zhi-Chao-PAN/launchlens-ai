import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { POST } from "./route";

describe("POST /api/generate", () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.MINIMAX_API_KEY;
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.MINIMAX_API_KEY;
  });

  it("rejects short ideas", async () => {
    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        body: JSON.stringify({ idea: "short" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Please provide a product idea with at least 12 characters.",
    });
  });

  it("returns demo generation without an API key", async () => {
    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        body: JSON.stringify({
          idea: "An AI launch planner for solo founders.",
          audience: "Solo founders",
          market: "Micro-SaaS",
          tone: "Practical",
          constraints: "No secrets.",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.mode).toBe("demo");
    expect(body.workspace.provider).toBe("mock");
  });
});
