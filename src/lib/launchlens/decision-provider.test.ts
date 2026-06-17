import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { exampleWorkspaces } from "./example-workspaces";
import {
  DECISION_PROMPT_VERSION,
  decisionSourceFromExperiment,
} from "./decision";
import { generateDecisionBrief } from "./decision-provider";

describe("generateDecisionBrief", () => {
  const source = decisionSourceFromExperiment(
    exampleWorkspaces[0].execution.experiments[0],
  );

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.MINIMAX_API_KEY;
    delete process.env.MINIMAX_BASE_URL;
    delete process.env.MINIMAX_MODEL;
    delete process.env.DECISION_COPILOT_LIVE_ENABLED;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.MINIMAX_API_KEY;
    delete process.env.MINIMAX_BASE_URL;
    delete process.env.MINIMAX_MODEL;
    delete process.env.DECISION_COPILOT_LIVE_ENABLED;
  });

  it("uses an evidence-bound mock brief without provider keys", async () => {
    const result = await generateDecisionBrief(source);

    expect(result.mode).toBe("demo");
    expect(result.usedFallback).toBe(false);
    expect(result.brief.provider).toBe("mock");
    expect(result.brief.promptVersion).toBe(DECISION_PROMPT_VERSION);
    expect(
      result.brief.claims.flatMap((claim) => claim.evidenceIds),
    ).toEqual(
      source.evidence.map((item) => item.id),
    );
  });

  it("accepts complete MiniMax output with valid evidence citations", async () => {
    process.env.MINIMAX_API_KEY = "test-key";
    process.env.DECISION_COPILOT_LIVE_ENABLED = "true";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              output_text: JSON.stringify({
                recommendation: "proceed",
                evidenceStrength: "directional",
                headline: "Proceed with the evidence-backed activation wedge.",
                claims: [
                  {
                    text: "Founder interviews support prioritized activation fixes.",
                    stance: "supports",
                    evidenceIds: [source.evidence[0].id],
                  },
                ],
                unresolvedRisks: ["The sample is still concentrated."],
                nextActions: ["Run a second segment test."],
              }),
            }),
            { status: 200 },
          ),
      ),
    );

    const result = await generateDecisionBrief(source);

    expect(result.mode).toBe("real");
    expect(result.usedFallback).toBe(false);
    expect(result.brief.provider).toBe("minimax");
    expect(result.brief.claims[0].evidenceIds).toEqual([
      source.evidence[0].id,
    ]);
  });

  it("normalizes claim stance from cited evidence signals", async () => {
    process.env.MINIMAX_API_KEY = "test-key";
    process.env.DECISION_COPILOT_LIVE_ENABLED = "true";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              output_text: JSON.stringify({
                recommendation: "proceed",
                evidenceStrength: "directional",
                headline: "Proceed with the evidence-backed activation wedge.",
                claims: [
                  {
                    text: "Founder interviews support prioritized activation fixes.",
                    stance: "context",
                    evidenceIds: [source.evidence[0].id],
                  },
                ],
                unresolvedRisks: ["The sample is still concentrated."],
                nextActions: ["Run a second segment test."],
              }),
            }),
            { status: 200 },
          ),
      ),
    );

    const result = await generateDecisionBrief(source);

    expect(result.mode).toBe("real");
    expect(result.brief.claims[0].stance).toBe("supports");
  });

  it("falls back when a provider invents a citation", async () => {
    process.env.MINIMAX_API_KEY = "test-key";
    process.env.DECISION_COPILOT_LIVE_ENABLED = "true";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              output_text: JSON.stringify({
                recommendation: "proceed",
                evidenceStrength: "directional",
                headline: "Proceed.",
                claims: [
                  {
                    text: "Invented support.",
                    stance: "supports",
                    evidenceIds: ["invented-evidence"],
                  },
                ],
                unresolvedRisks: ["Unknown."],
                nextActions: ["Ship."],
              }),
            }),
            { status: 200 },
          ),
      ),
    );

    const result = await generateDecisionBrief(source);

    expect(result.mode).toBe("demo");
    expect(result.usedFallback).toBe(true);
    expect(result.fallbackReason).toBe("provider_validation_failed");
    expect(result.brief.provider).toBe("mock");
  });

  it("does not leak provider response text into fallback logs", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    process.env.MINIMAX_API_KEY = "test-key";
    process.env.DECISION_COPILOT_LIVE_ENABLED = "true";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("sensitive-upstream-body", { status: 200 })),
    );

    const result = await generateDecisionBrief(source);

    expect(result.usedFallback).toBe(true);
    expect(JSON.stringify(warn.mock.calls)).not.toContain(
      "sensitive-upstream-body",
    );
  });

  it("generateDecisionBrief returns a result with valid schema version", async () => {
    const result = await generateDecisionBrief(source);
    expect(result.brief.schemaVersion).toBe(1);
  });

});
