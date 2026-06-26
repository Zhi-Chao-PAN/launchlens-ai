import { describe, expect, it } from "vitest";

import { evaluatePublicDemoStatus } from "./public-demo-verification";

describe("public demo verification", () => {
  it("accepts a healthy public demo status", () => {
    expect(
      evaluatePublicDemoStatus({
        status: "ok",
        dbConfigured: true,
        dbHealthy: true,
        gitSha: "64b7a50abcdef",
        vercelEnv: "production",
      }),
    ).toMatchObject({
      ok: true,
      issues: [],
      summary: {
        gitSha: "64b7a50abcdef",
        vercelEnv: "production",
        dbConfigured: true,
        dbHealthy: true,
      },
    });
  });

  it("catches protected preview or non-LaunchLens responses", () => {
    expect(evaluatePublicDemoStatus({ status: "login" })).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        "Status endpoint did not report status=ok.",
        "Public demo database is not configured.",
        "Public demo database health check failed.",
        "Status endpoint did not include a gitSha.",
      ]),
    });
  });

  it("can enforce the expected deployed git SHA", () => {
    expect(
      evaluatePublicDemoStatus(
        {
          status: "ok",
          dbConfigured: true,
          dbHealthy: true,
          gitSha: "5ab4b2e9bb4338ef",
        },
        { expectedGitSha: "64b7a50" },
      ),
    ).toMatchObject({
      ok: false,
      issues: [
        "Public demo gitSha 5ab4b2e9bb4338ef does not match expected 64b7a50.",
      ],
    });
  });

  it("accepts short expected SHA prefixes", () => {
    expect(
      evaluatePublicDemoStatus(
        {
          status: "ok",
          dbConfigured: true,
          dbHealthy: true,
          gitSha: "64b7a50abcdef",
        },
        { expectedGitSha: "64b7a50" },
      ).ok,
    ).toBe(true);
  });
});
