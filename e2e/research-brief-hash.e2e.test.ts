import { expect, test, type Page } from "@playwright/test";

async function dismissQuickStart(page: Page) {
  const quickStart = page.getByRole("dialog", { name: /quick start guide/i });

  if (await quickStart.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await page.getByRole("button", { name: /get started/i }).click();
    await expect(quickStart).toBeHidden();
  }
}

function encodeBriefHash(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

test.describe("Research Studio hash handoff", () => {
  test("prefills the brief and keeps provenance through generation", async ({
    page,
  }) => {
    const envelope = {
      schemaVersion: "1.0.0",
      source: "launchlens-research-studio",
      exportedAt: "2026-06-28T00:00:00.000Z",
      sessionId: "rs-hash-e2e",
      query: "AI 销售跟进助手",
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

    await page.goto(`/#brief=${encodeBriefHash(envelope)}`);

    await expect(page.locator("#founder-brief-idea")).toHaveValue(
      envelope.input.idea,
    );
    await expect(page.locator("#founder-brief-audience")).toHaveValue(
      envelope.input.audience,
    );
    expect(await page.evaluate(() => window.location.hash)).toBe("");

    await dismissQuickStart(page);
    await page.getByRole("button", { name: /generate workspace/i }).click();

    await expect(
      page.getByText(/Generated from Research Studio intelligence report/i),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/rs-hash-e2e/i)).toBeVisible();
    await expect(page.getByText(/Opportunity 82/i)).toBeVisible();
    await expect(page.getByText(/Risk 31/i)).toBeVisible();
  });
});
