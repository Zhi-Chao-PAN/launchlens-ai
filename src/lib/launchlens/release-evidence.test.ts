import { describe, expect, it } from "vitest";

import {
  buildReleaseEvidenceMarkdown,
  summarizeReleaseEvidence,
  type ReleaseEvidenceReport,
} from "./release-evidence";

function report(
  overrides: Partial<ReleaseEvidenceReport> = {},
): ReleaseEvidenceReport {
  return {
    generatedAt: "2026-06-27T00:00:00.000Z",
    baseUrl: "https://launchlens-ai-two.vercel.app",
    expectedGitSha: "505eb79",
    git: {
      branch: "main",
      headSha: "505eb79abcdef",
      shortSha: "505eb79",
      upstream: "origin/main",
      ahead: 1,
      dirty: false,
      remoteUrl: "https://github.com/Zhi-Chao-PAN/launchlens-ai.git",
    },
    publicStatusHttp: {
      status: 200,
      contentType: "application/json",
    },
    publicDemo: {
      ok: true,
      issues: [],
      summary: {
        gitSha: "505eb79abcdef",
        vercelEnv: "production",
        dbConfigured: true,
        dbHealthy: true,
      },
    },
    commands: ["npm run evidence:release"],
    notes: ["Production evidence is safe to attach to a release note."],
    ...overrides,
  };
}

describe("release evidence", () => {
  it("marks matching production as verified", () => {
    expect(summarizeReleaseEvidence(report())).toMatchObject({
      stage: "production_verified",
    });
  });

  it("marks healthy old production as promotion pending", () => {
    expect(
      summarizeReleaseEvidence(
        report({
          publicDemo: {
            ok: false,
            issues: [
              "Public demo gitSha 5ab4b2e does not match expected 505eb79.",
            ],
            summary: {
              gitSha: "5ab4b2e",
              vercelEnv: "production",
              dbConfigured: true,
              dbHealthy: true,
            },
          },
        }),
      ),
    ).toMatchObject({
      stage: "promotion_pending",
    });
  });

  it("blocks evidence from a dirty tree", () => {
    expect(
      summarizeReleaseEvidence(
        report({
          git: {
            branch: "main",
            headSha: "505eb79abcdef",
            shortSha: "505eb79",
            upstream: "origin/main",
            ahead: 1,
            dirty: true,
            remoteUrl: "https://github.com/Zhi-Chao-PAN/launchlens-ai.git",
          },
        }),
      ),
    ).toMatchObject({
      stage: "blocked",
    });
  });

  it("renders a compact markdown evidence report", () => {
    expect(buildReleaseEvidenceMarkdown(report())).toContain(
      "Stage: production_verified",
    );
    expect(buildReleaseEvidenceMarkdown(report())).toContain(
      "Expected git SHA: 505eb79",
    );
  });
});
