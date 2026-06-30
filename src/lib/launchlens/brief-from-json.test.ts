import { describe, expect, it } from "vitest";

import {
  briefFromJson,
  briefFromFile,
  type BriefImportError,
} from "./brief-from-json";
import type { LaunchLensInput } from "./types";

const validInput: LaunchLensInput = {
  idea: "An AI onboarding analyst for indie SaaS founders.",
  audience: "Solo and two-person B2B SaaS teams.",
  market: "Vertical AI workflow tools for SaaS growth.",
  tone: "Practical, crisp, and founder-friendly",
  constraints: "Ship a first paid experiment within 10 days.",
};

// A Research Studio envelope, matching what brief-mapper.ts exports.
function researchStudioEnvelope(
  input: Partial<LaunchLensInput> = {},
  envelope: Record<string, unknown> = {},
) {
  return JSON.stringify({
    schemaVersion: "1.0.0",
    source: "launchlens-research-studio",
    exportedAt: "2026-06-28T00:00:00.000Z",
    sessionId: "sess-abc123",
    query: "AI onboarding analyst",
    input: { ...validInput, ...input },
    meta: { opportunityScore: 78, riskScore: 42, completedAgents: [], truncated: [] },
    ...envelope,
  });
}

describe("briefFromJson — Research Studio envelope", () => {
  it("parses the envelope and returns the five-field input", () => {
    const result = briefFromJson(researchStudioEnvelope());
    expect(result.source).toBe("research-studio");
    expect(result.input.idea).toBe(validInput.idea);
    expect(result.input.audience).toBe(validInput.audience);
    expect(result.input.tone).toBe(validInput.tone);
    expect(result.sourceBrief).toEqual({
      source: "launchlens-research-studio",
      sessionId: "sess-abc123",
      exportedAt: "2026-06-28T00:00:00.000Z",
      opportunityScore: 78,
      riskScore: 42,
    });
    expect(result.warnings).toEqual([]);
  });

  it("keeps provenance and optional report URL when extra envelope fields exist", () => {
    const result = briefFromJson(
      researchStudioEnvelope(
        {},
        { reportUrl: " https://research.launchlens.ai/research/sess-abc123 " },
      ),
    );
    expect(result.source).toBe("research-studio");
    expect(result.sourceBrief?.reportUrl).toBe(
      "https://research.launchlens.ai/research/sess-abc123",
    );
  });

  it("keeps provenance but drops unsafe report URLs", () => {
    const result = briefFromJson(
      researchStudioEnvelope({}, { reportUrl: "javascript:alert(1)" }),
    );

    expect(result.source).toBe("research-studio");
    expect(result.sourceBrief).toMatchObject({
      source: "launchlens-research-studio",
      sessionId: "sess-abc123",
    });
    expect(result.sourceBrief?.reportUrl).toBeUndefined();
  });

  it("loads the brief even when provenance is incomplete", () => {
    const result = briefFromJson(
      JSON.stringify({
        schemaVersion: "1.0.0",
        source: "launchlens-research-studio",
        input: validInput,
        meta: { opportunityScore: 78, riskScore: 42 },
      }),
    );
    expect(result.input.idea).toBe(validInput.idea);
    expect(result.sourceBrief).toBeUndefined();
    expect(
      result.warnings.some((warning) => warning.includes("provenance")),
    ).toBe(true);
  });
});

describe("briefFromJson — bare LaunchLensInput", () => {
  it("parses a bare five-field object", () => {
    const result = briefFromJson(JSON.stringify(validInput));
    expect(result.source).toBe("launchlens");
    expect(result.input).toEqual(validInput);
    expect(result.warnings).toEqual([]);
  });

  it("accepts a bare object with only some fields present", () => {
    const result = briefFromJson(JSON.stringify({ idea: validInput.idea, tone: "Warm" }));
    expect(result.input.idea).toBe(validInput.idea);
    expect(result.input.tone).toBe("Warm");
    expect(result.input.audience).toBe("");
  });
});

describe("briefFromJson — legacy free-text brief", () => {
  it("places the paragraph into idea and warns about the other fields", () => {
    const paragraph = "A concise, self-contained paragraph a founder could act on right now.";
    const result = briefFromJson(JSON.stringify({ launchlensBrief: paragraph }));
    expect(result.input.idea).toBe(paragraph);
    expect(result.input.audience).toBe("");
    expect(result.warnings.some((w) => w.includes("legacy free-text"))).toBe(true);
  });

  it("ignores an empty launchlensBrief string", () => {
    expect(() => briefFromJson(JSON.stringify({ launchlensBrief: "   " }))).toThrow();
  });
});

describe("briefFromJson — truncation", () => {
  it("truncates fields to their per-field advisory limit and records a warning", () => {
    const long = "x".repeat(1400);
    const result = briefFromJson(
      researchStudioEnvelope({ idea: long, audience: long }),
    );
    // idea clamps to its 500-char advisory limit, audience to its 240-char
    // advisory limit (both tighter than the 1200-char server gate) so the
    // imported brief never starts the form in a red "Too long" state.
    expect(result.input.idea.length).toBe(500);
    expect(result.input.audience.length).toBe(240);
    expect(result.warnings.some((w) => w.includes("idea was truncated"))).toBe(true);
    expect(result.warnings.some((w) => w.includes("audience was truncated"))).toBe(true);
  });

  it("leaves fields under their advisory limit untouched", () => {
    const result = briefFromJson(
      researchStudioEnvelope({
        idea: "x".repeat(499),
        audience: "x".repeat(240),
        market: "x".repeat(120),
        constraints: "x".repeat(320),
      }),
    );
    expect(result.input.idea.length).toBe(499);
    expect(result.input.audience.length).toBe(240);
    expect(result.input.market.length).toBe(120);
    expect(result.input.constraints.length).toBe(320);
    expect(result.warnings).toHaveLength(0);
  });
});

describe("briefFromJson — errors", () => {
  it("throws invalid_json for malformed JSON", () => {
    try {
      briefFromJson("{not json");
      throw new Error("should have thrown");
    } catch (e) {
      const err = e as BriefImportError;
      expect(err.code).toBe("invalid_json");
    }
  });

  it("throws invalid_json for a non-object", () => {
    try {
      briefFromJson("[1,2,3]");
      throw new Error("should have thrown");
    } catch (e) {
      const err = e as BriefImportError;
      expect(err.code).toBe("invalid_json");
    }
  });

  it("throws missing_input when no recognizable shape is present", () => {
    try {
      briefFromJson(JSON.stringify({ unrelated: "data" }));
      throw new Error("should have thrown");
    } catch (e) {
      const err = e as BriefImportError;
      expect(err.code).toBe("missing_input");
    }
  });

  it("throws missing_input when all input fields are empty", () => {
    try {
      briefFromJson(JSON.stringify({ idea: "", audience: "", market: "", tone: "", constraints: "" }));
      throw new Error("should have thrown");
    } catch (e) {
      const err = e as BriefImportError;
      expect(err.code).toBe("missing_input");
    }
  });

  it("mentions Research Studio in the message when the envelope source matches", () => {
    const envelope = JSON.stringify({
      source: "launchlens-research-studio",
      input: { idea: "", audience: "", market: "", tone: "", constraints: "" },
    });
    try {
      briefFromJson(envelope);
      throw new Error("should have thrown");
    } catch (e) {
      const err = e as BriefImportError;
      expect(err.code).toBe("missing_input");
      expect(err.message).toContain("Research Studio");
    }
  });
});

describe("briefFromFile", () => {
  it("parses a small file", async () => {
    const file = new File([researchStudioEnvelope()], "brief.json", { type: "application/json" });
    const result = await briefFromFile(file);
    expect(result.source).toBe("research-studio");
    expect(result.input.idea).toBe(validInput.idea);
  });

  it("rejects a file over 512 KB", async () => {
    const huge = "x".repeat(600 * 1024);
    const file = new File([huge], "big.json", { type: "application/json" });
    try {
      await briefFromFile(file);
      throw new Error("should have thrown");
    } catch (e) {
      const err = e as BriefImportError;
      expect(err.code).toBe("too_large");
    }
  });
});

// ---------------------------------------------------------------------------
// R251/R254 cross-repo contract: this block pins the wire shape that
// launchlens-research-studio's brief-mapper.ts::toLaunchLensBrief emits.
// The fixture below is a verbatim copy of that envelope (hand-verified against
// the mapper's field derivation). If either repo changes the envelope shape —
// field names, the meta.toneDefault flag, provenance keys — this test breaks
// before a silent handoff regression can ship. The symmetric encoder test
// lives in research-studio's brief-mapper.test.ts.
// ---------------------------------------------------------------------------
describe("briefFromJson — Research Studio handoff contract", () => {
  // Fixture mirrors toLaunchLensBrief output exactly: schemaVersion, source,
  // input (5 fields), meta with toneDefault:true, plus provenance.
  const studioEnvelope = JSON.stringify({
    schemaVersion: "1.0.0",
    source: "launchlens-research-studio",
    exportedAt: "2026-06-28T12:00:00.000Z",
    sessionId: "sess-contract-001",
    query: "AI onboarding analyst for indie SaaS",
    reportUrl: "https://launchlens-research-studio.vercel.app/research/sess-contract-001",
    input: {
      idea: "AI onboarding analyst for indie SaaS founders",
      audience: "Target users: solo founders (building). Segments: B2B SaaS.",
      market: "$2.5B TAM, growing 18%/yr. Key competitors: Appcues, Userflow.",
      tone: "Practical, crisp, and founder-friendly",
      constraints: "Pricing guidance: Tier Starter. Key risks: churn.",
    },
    meta: {
      opportunityScore: 82,
      riskScore: 38,
      completedAgents: [
        "competitor-analyst",
        "market-sizer",
        "pain-detective",
        "pricing-scout",
        "synthesis",
      ],
      truncated: [],
      toneDefault: true,
    },
  });

  it("round-trips every input field unchanged", () => {
    const result = briefFromJson(studioEnvelope);
    expect(result.input.idea).toBe("AI onboarding analyst for indie SaaS founders");
    expect(result.input.audience).toBe("Target users: solo founders (building). Segments: B2B SaaS.");
    expect(result.input.market).toBe("$2.5B TAM, growing 18%/yr. Key competitors: Appcues, Userflow.");
    expect(result.input.tone).toBe("Practical, crisp, and founder-friendly");
    expect(result.input.constraints).toBe("Pricing guidance: Tier Starter. Key risks: churn.");
  });

  it("preserves the full provenance chain (sessionId, reportUrl, scores)", () => {
    const result = briefFromJson(studioEnvelope);
    expect(result.source).toBe("research-studio");
    expect(result.sourceBrief).toEqual({
      source: "launchlens-research-studio",
      sessionId: "sess-contract-001",
      reportUrl: "https://launchlens-research-studio.vercel.app/research/sess-contract-001",
      exportedAt: "2026-06-28T12:00:00.000Z",
      opportunityScore: 82,
      riskScore: 38,
    });
  });

  // R254: the toneDefault flag is what lets the workspace preserve the user's
  // tone. This assertion guards the flag's presence so a mapper change that
  // drops it fails here rather than silently clobbering user tone.
  it("propagates meta.toneDefault so the workspace can preserve user tone", () => {
    const result = briefFromJson(studioEnvelope);
    expect(result.toneIsDefault).toBe(true);
  });

  it("does not flag toneIsDefault when toneDefault is absent (older envelopes)", () => {
    const legacy = JSON.stringify({
      schemaVersion: "1.0.0",
      source: "launchlens-research-studio",
      exportedAt: "2026-06-28T12:00:00.000Z",
      sessionId: "sess-legacy",
      input: validInput,
      meta: { opportunityScore: 50, riskScore: 50, completedAgents: [], truncated: [] },
    });
    const result = briefFromJson(legacy);
    expect(result.toneIsDefault).not.toBe(true);
  });
});
