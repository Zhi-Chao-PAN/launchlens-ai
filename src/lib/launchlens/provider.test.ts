import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildMockWorkspace } from "./mock-provider";
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
    delete process.env.MINIMAX_MODEL;
    delete process.env.LAUNCHLENS_PROVIDER_LIVE_ENABLED;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.MINIMAX_API_KEY;
    delete process.env.MINIMAX_BASE_URL;
    delete process.env.MINIMAX_MODEL;
    delete process.env.LAUNCHLENS_PROVIDER_LIVE_ENABLED;
  });

  it("uses demo mode when no provider key exists", async () => {
    delete process.env.OPENAI_API_KEY;

    const result = await generateLaunchWorkspace(input);

    expect(result.mode).toBe("demo");
    expect(result.usedFallback).toBe(false);
    expect(result.workspace.provider).toBe("mock");
  });

  it("keeps workspace generation in demo mode until live provider mode is explicit", async () => {
    process.env.MINIMAX_API_KEY = "test-key";

    const result = await generateLaunchWorkspace(input);

    expect(result.mode).toBe("demo");
    expect(result.usedFallback).toBe(false);
    expect(result.workspace.provider).toBe("mock");
  });

  it("falls back to mock mode when a configured provider fails", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.LAUNCHLENS_PROVIDER_LIVE_ENABLED = "true";
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

  it("uses MiniMax when configured and the complete schema is present", async () => {
    const {
      provider: _provider,
      generatedAt: _generatedAt,
      ...payload
    } = buildMockWorkspace(input, "minimax");
    void _provider;
    void _generatedAt;
    const repairableJson = JSON.stringify(payload, null, 2).replace(
      /\n}$/,
      ",\n}",
    );

    process.env.MINIMAX_API_KEY = "test-key";
    process.env.LAUNCHLENS_PROVIDER_LIVE_ENABLED = "true";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              output_text: `<think>compact plan</think>\n\`\`\`json\n${repairableJson}\n\`\`\``,
            }),
            { status: 200 },
          ),
      ),
    );

    const result = await generateLaunchWorkspace(input);

    expect(result.mode).toBe("real");
    expect(result.usedFallback).toBe(false);
    expect(result.workspace.provider).toBe("minimax");
    expect(result.workspace.summary).toBe(payload.summary);
    expect(result.workspace.landingPage.headline).toBeTruthy();
    expect(result.workspace.tasks.length).toBeGreaterThan(0);
  });

  it("rejects incomplete live output instead of scoring mock-filled sections", async () => {
    process.env.MINIMAX_API_KEY = "test-key";
    process.env.LAUNCHLENS_PROVIDER_LIVE_ENABLED = "true";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              output_text: JSON.stringify({
                summary: "A focused launch workspace.",
                targetUsers: ["Solo founder", "Small SaaS team"],
                pains: ["Unclear launch scope", "Weak validation loops"],
                mvpScope: ["Intake", "GTM generation", "Task plan"],
                backlog: [],
              }),
            }),
            { status: 200 },
          ),
      ),
    );

    const result = await generateLaunchWorkspace(input);

    expect(result.mode).toBe("demo");
    expect(result.usedFallback).toBe(true);
    expect(result.fallbackReason).toBe("provider_validation_failed");
    expect(result.workspace.provider).toBe("mock");
  });

  it("does not expose invalid provider response text in fallback logs", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    process.env.MINIMAX_API_KEY = "test-key";
    process.env.LAUNCHLENS_PROVIDER_LIVE_ENABLED = "true";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("upstream-secret-body", { status: 200 })),
    );

    const result = await generateLaunchWorkspace(input);

    expect(result.fallbackReason).toBe("provider_validation_failed");
    expect(warn).toHaveBeenCalledWith("[LaunchLens provider fallback]", {
      code: "provider_validation_failed",
    });
    expect(JSON.stringify(warn.mock.calls)).not.toContain(
      "upstream-secret-body",
    );
  });
});
