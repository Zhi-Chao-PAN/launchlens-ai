import { describe, expect, it } from "vitest";

import {
  briefFromHashFragment,
  briefJsonFromHashFragment,
} from "./brief-fragment";

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

describe("brief hash fragment import", () => {
  it("decodes a base64url Research Studio brief with Chinese text", () => {
    const envelope = {
      schemaVersion: "1.0.0",
      source: "launchlens-research-studio",
      exportedAt: "2026-06-28T00:00:00.000Z",
      sessionId: "rs-session-42",
      query: "AI 销售助理",
      input: {
        idea: "面向独立 SaaS 创始人的 AI 销售跟进助手",
        audience: "两人以内的 B2B SaaS 团队",
        market: "垂直 AI 工作流工具",
        tone: "Practical, crisp, and founder-friendly",
        constraints: "10 天内验证首个付费实验",
      },
      meta: {
        opportunityScore: 82,
        riskScore: 31,
        completedAgents: [],
        truncated: [],
      },
    };
    const json = JSON.stringify(envelope);
    const hash = `#brief=${encodeBase64Url(json)}`;

    expect(briefJsonFromHashFragment(hash)).toBe(json);
    const result = briefFromHashFragment(hash);
    expect(result?.input.idea).toBe(envelope.input.idea);
    expect(result?.sourceBrief).toMatchObject({
      sessionId: "rs-session-42",
      opportunityScore: 82,
      riskScore: 31,
    });
  });

  it("ignores unrelated hash fragments", () => {
    expect(briefFromHashFragment("#section=brief")).toBeNull();
  });
});
