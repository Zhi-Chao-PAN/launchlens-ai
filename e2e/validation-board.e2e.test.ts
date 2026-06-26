import { expect, test, type Locator, type Page } from "@playwright/test";

async function isVisible(locator: Locator, timeout = 1_000): Promise<boolean> {
  try {
    await expect(locator).toBeVisible({ timeout });
    return true;
  } catch {
    return false;
  }
}

async function dismissQuickStart(page: Page): Promise<void> {
  const quickStart = page.getByRole("dialog", { name: /quick start guide/i });
  if (await isVisible(quickStart, 3_000)) {
    await page.getByRole("button", { name: /get started/i }).click();
    await expect(quickStart).toBeHidden();
  }
}

async function generateWorkspaceAndWaitForValidationLoop(
  page: Page,
): Promise<Locator> {
  await page.goto("/");
  await dismissQuickStart(page);

  const validationLoop = page.getByRole("region", { name: /validation loop/i });

  if (!(await isVisible(validationLoop))) {
    const generateWorkspace = page.getByRole("button", {
      name: /generate workspace/i,
    });
    await expect(generateWorkspace).toBeVisible({ timeout: 30_000 });
    await generateWorkspace.click();
  }

  await expect(validationLoop).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByRole("heading", { name: /validation loop/i }),
  ).toBeVisible();
  await dismissQuickStart(page);
  return validationLoop;
}

test.describe("Validation board power-user features", () => {
  test("advanced search supports exclusion and filters cards", async ({
    page,
  }) => {
    const validationLoop = await generateWorkspaceAndWaitForValidationLoop(page);
    const search = page.getByPlaceholder(/search/i);
    await expect(search).toBeVisible();

    await search.fill("speed -speed");
    await expect(validationLoop.locator("article")).toHaveCount(0);

    await search.fill("");
    await expect
      .poll(async () => validationLoop.locator("article").count())
      .toBeGreaterThan(0);
  });

  test("slash key focuses search input", async ({ page }) => {
    await generateWorkspaceAndWaitForValidationLoop(page);
    await page.locator("body").click();
    await page.keyboard.press("/");
    await expect(page.getByPlaceholder(/search/i)).toBeFocused();
  });

  test("keyboard hint bar mentions slash and command palette", async ({
    page,
  }) => {
    await generateWorkspaceAndWaitForValidationLoop(page);
    await expect(page.locator("kbd").filter({ hasText: /^\/$/ })).toBeVisible();
    await expect(page.getByText(/command palette/i)).toBeVisible();
  });
});
