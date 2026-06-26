import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { POST } from "./route";

describe("/api/generate", () => {
  beforeEach(() => {
    delete process.env.MINIMAX_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    delete process.env.MINIMAX_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  function postJson(body: unknown) {
    return POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
  }

  it("rejects non-JSON payloads with 400", async () => {
    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "not-json",
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid JSON payload.",
    });
  });

  it("rejects payloads that are missing the idea field with 400", async () => {
    const response = await postJson({});
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("idea"),
    });
  });

  it("rejects payloads whose idea is too short with 400", async () => {
    const response = await postJson({
      idea: "too short",
      audience: "indie founders",
      market: "B2B SaaS",
      tone: "calm",
      constraints: "no budget",
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("12 characters"),
    });
  });

  it("rejects payloads that exceed the per-field length cap with 400", async () => {
    const response = await postJson({
      idea: "A real product idea with more than twelve characters of detail.",
      audience: "a".repeat(1300),
      market: "B2B SaaS",
      tone: "calm",
      constraints: "no budget",
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("audience"),
    });
  });

  it("returns a valid workspace for a well-formed mock request", async () => {
    const response = await postJson({
      idea: "A weekly activation-fix digest for solo founders.",
      audience: "indie founders",
      market: "B2B SaaS",
      tone: "calm",
      constraints: "no marketing budget",
    });
    expect(response.status).toBe(200);
    const text = await response.text();
    const body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    const ws = (body.workspace ?? {}) as Record<string, unknown>;
    expect(typeof ws.summary).toBe("string");
    expect(Array.isArray(ws.targetUsers)).toBe(true);
    expect(body.mode).toBe("demo");
    expect(body.usedFallback).toBe(false);
  });
});
