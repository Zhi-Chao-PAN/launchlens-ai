import { expect, test, type Page } from "@playwright/test";

const LOCAL_WORKSPACE_KEY = "launchlens.currentWorkspace.v1";

async function dismissQuickStart(page: Page) {
  const quickStart = page.getByRole("dialog", { name: /quick start guide/i });

  const appeared = await quickStart
    .waitFor({ state: "visible", timeout: 3_000 })
    .then(() => true)
    .catch(() => false);
  if (appeared) {
    await page.getByRole("button", { name: /get started/i }).click();
    await expect(quickStart).toBeHidden();
  }
}

function encodeBriefHash(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function researchStudioEnvelope() {
  return {
    schemaVersion: "1.0.0",
    source: "launchlens-research-studio",
    exportedAt: "2026-06-28T00:00:00.000Z",
    sessionId: "rs-hash-e2e",
    query: "AI sales follow-up assistant",
    input: {
      idea: "An AI sales follow-up assistant for independent SaaS founders",
      audience: "B2B SaaS teams with no more than two founders",
      market: "Vertical AI workflow tools",
      tone: "Practical, crisp, and founder-friendly",
      constraints: "Validate the first paid experiment within ten days",
    },
    meta: {
      opportunityScore: 82,
      riskScore: 31,
      completedAgents: [],
      truncated: [],
      toneDefault: true,
    },
  };
}

async function seedStaleLocalWorkspace(page: Page) {
  const staleInput = {
    idea: "A stale local workspace that must not override an explicit handoff",
    audience: "Existing local users",
    market: "Legacy workflow tools",
    tone: "Analytical and investor-ready",
    constraints: "Keep the previously generated workspace",
  };

  await page.goto("/");
  await dismissQuickStart(page);
  await page.waitForFunction(
    (key) => window.localStorage.getItem(key) !== null,
    LOCAL_WORKSPACE_KEY,
  );
  await page.evaluate(
    ({ key, input }) => {
      const raw = window.localStorage.getItem(key);
      if (!raw) throw new Error("Expected an autosaved local workspace.");
      const snapshot = JSON.parse(raw) as { input: typeof input };
      snapshot.input = input;
      window.localStorage.setItem(key, JSON.stringify(snapshot));
    },
    { key: LOCAL_WORKSPACE_KEY, input: staleInput },
  );

  return staleInput;
}

test.describe("Research Studio hash handoff", () => {
  test("wins over stale local storage and keeps provenance through generation", async ({
    page,
  }) => {
    const envelope = researchStudioEnvelope();
    await seedStaleLocalWorkspace(page);

    await page.goto(
      `/?handoff=generate#brief=${encodeBriefHash(envelope)}`,
    );
    await dismissQuickStart(page);

    await expect(page.locator("#founder-brief-idea")).toHaveValue(
      envelope.input.idea,
    );
    await expect(page.locator("#founder-brief-audience")).toHaveValue(
      envelope.input.audience,
    );
    await expect(page.getByTestId("workspace-outdated-overlay")).toBeVisible();
    expect(await page.evaluate(() => window.location.hash)).toBe("");

    const generateButton = page.getByTestId("workspace-outdated-generate");
    await expect(generateButton).toBeEnabled();
    await generateButton.click();

    await expect(page.getByTestId("workspace-outdated-overlay")).toBeHidden({
      timeout: 30_000,
    });
    await expect(
      page.getByText(/Generated from Research Studio intelligence report/i),
    ).toBeVisible();
    await expect(page.getByText(/rs-hash-e2e/i)).toBeVisible();
    await expect(page.getByText(/Opportunity 82/i)).toBeVisible();
    await expect(page.getByText(/Risk 31/i)).toBeVisible();
  });

  test("discard restores the input that preceded the handoff", async ({
    page,
  }) => {
    const envelope = researchStudioEnvelope();
    const staleInput = await seedStaleLocalWorkspace(page);

    await page.goto(
      `/?handoff=discard#brief=${encodeBriefHash(envelope)}`,
    );
    await dismissQuickStart(page);
    await expect(page.locator("#founder-brief-idea")).toHaveValue(
      envelope.input.idea,
    );

    await page.getByTestId("workspace-outdated-discard").click();

    await expect(page.getByTestId("workspace-outdated-overlay")).toBeHidden();
    await expect(page.locator("#founder-brief-idea")).toHaveValue(
      staleInput.idea,
    );
    await expect(page.locator("#founder-brief-audience")).toHaveValue(
      staleInput.audience,
    );
  });
});
