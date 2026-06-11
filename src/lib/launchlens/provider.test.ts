import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { generateLaunchWorkspace } from "./provider";
import type { LaunchLensInput } from "./types";

const input: LaunchLensInput = {
  idea: "An AI planner that converts product ideas into launch tasks.",
  audience: "Solo founders",
  market: "AI SaaS",
  tone: "Practical",
  constraints: "Run without secrets.",
};

describe("generateLaunchWorkspace", () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.MINIMAX_API_KEY;
    delete process.env.MINIMAX_BASE_URL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.MINIMAX_API_KEY;
    delete process.env.MINIMAX_BASE_URL;
  });

  it("uses demo mode when no provider key exists", async () => {
    delete process.env.OPENAI_API_KEY;

    const result = await generateLaunchWorkspace(input);

    expect(result.mode).toBe("demo");
    expect(result.usedFallback).toBe(false);
    expect(result.workspace.provider).toBe("mock");
  });

  it("falls back to mock mode when a configured provider fails", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("rate limited", { status: 429 })),
    );

    const result = await generateLaunchWorkspace(input);

    expect(result.mode).toBe("demo");
    expect(result.usedFallback).toBe(true);
    expect(result.fallbackReason).toBe("provider_failed");
    expect(result.workspace.provider).toBe("mock");
  });
});
