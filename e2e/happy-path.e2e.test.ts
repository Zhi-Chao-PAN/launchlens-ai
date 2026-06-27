import { expect, test, type Page } from "@playwright/test";

async function dismissQuickStart(page: Page) {
  const quickStart = page.getByRole("dialog", { name: /quick start guide/i });

  if (await quickStart.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await page.getByRole("button", { name: /get started/i }).click();
    await expect(quickStart).toBeHidden();
  }
}

/**
 * End-to-end happy path for the LaunchLens AI portfolio.
 *
 * The test runs against a real `next dev` server on port 3099. Because
 * the dev server auto-loads .env files, a real database connection
 * exists in the e2e environment, so the privacy boundary is asserted
 * via the authorization layer (401 for a malformed owner token) rather
 * than via the storage-availability layer (503). The e2e test does not
 * need any secret.
 */

test.describe("LaunchLens AI end-to-end", () => {
  test("founder brief -> workspace -> share -> privacy boundary", async ({
    page,
  }) => {
    if (!page) {
      throw new Error("Playwright page is not configured.");
    }

    // 1. Home page renders the workspace heading, sample brief picker,
    //    and the founder brief textarea is pre-filled by the page.
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Go-to-market workspace/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /B2B SaaS activation/i }),
    ).toBeVisible();
    const ideaTextarea = page.locator("textarea").first();
    await expect(ideaTextarea).not.toHaveValue("");
    await dismissQuickStart(page);

    // 2. Click the first sample brief so the workspace hydrates with
    //    the activation-analyst state.
    await page.getByRole("button", { name: /B2B SaaS activation/i }).click();
    await expect(
      page
        .getByRole("heading", {
          name: /The buyer values speed from idea to action/i,
        })
        .first(),
    ).toBeVisible();

    // 3. Generate a fresh workspace through the real /api/generate
    //    route via the in-page fetch helper. The mock provider is the
    //    default so no key is required.
    const generationStatus = await page.evaluate(async () => {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idea:
            "A weekly activation-fix digest for solo founders of B2B SaaS products.",
          audience: "indie founders",
          market: "B2B SaaS",
          tone: "calm",
          constraints: "no marketing budget",
        }),
      });
      const body = (await response.json()) as { workspace?: { summary?: string } };
      return {
        status: response.status,
        summary: body.workspace?.summary ?? "",
      };
    });
    expect(generationStatus.status).toBe(200);
    expect(generationStatus.summary.length).toBeGreaterThan(20);

    // 4. Authorization boundary: a malformed owner token must be
    //    rejected with 401, never 200. The error body must not leak
    //    any private workspace, evidence, or decision content.
    const privacyResult = await page.evaluate(async () => {
      const response = await fetch(
        "/api/tenants/00000000-0000-4000-8000-000000000000",
        { headers: { "x-launchlens-owner": "short" } },
      );
      const text = await response.text();
      return { status: response.status, body: text };
    });
    expect(privacyResult.status).toBe(401);
    expect(privacyResult.body).not.toContain("brief");
    expect(privacyResult.body).not.toContain("assumption");
    expect(privacyResult.body).not.toContain("grounded");

    // 5. The public share route renders a safe not-found state when
    //    the workspace id is malformed. Next dev can still return 200
    //    for the rendered not-found shell, so the privacy boundary is
    //    asserted through the safe copy and absence of private content
    //    without requiring the e2e run to query an external database.
    const shareResult = await page.evaluate(async () => {
      const response = await fetch("/share/not-a-real-id");
      const text = await response.text();
      return { status: response.status, body: text };
    });
    expect([200, 404]).toContain(shareResult.status);
    expect(shareResult.body).toContain("could not be found");
    expect(shareResult.body).not.toContain("activation-fix");
    expect(shareResult.body).not.toContain("Grounded claims");
  });
});
