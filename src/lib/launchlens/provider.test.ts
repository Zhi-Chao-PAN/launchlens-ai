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
    delete process.env.MINIMAX_MODEL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.MINIMAX_API_KEY;
    delete process.env.MINIMAX_BASE_URL;
    delete process.env.MINIMAX_MODEL;
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

  it("uses MiniMax when configured and fills non-core sections safely", async () => {
    const payload = {
      summary:
        "A focused launch workspace for founders who need a testable GTM plan.",
      targetUsers: ["Solo founder", "Small SaaS team"],
      pains: ["Unclear launch scope", "Weak validation loops"],
      mvpScope: ["Intake", "GTM generation", "Task plan"],
      backlog: [
        {
          feature: "Evidence tracker",
          why: "Connects assumptions to proof.",
          priority: "P1",
        },
      ],
    };
    const repairableJson = JSON.stringify(payload, null, 2).replace(
      /\n}$/,
      ",\n}",
    );

    process.env.MINIMAX_API_KEY = "test-key";
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
});
