import { expect, test } from "@playwright/test";

test.describe("Validation board power-user features", () => {
  test("advanced search supports exclusion and filters cards", async ({ page }) => {
    await page.goto("/");
    // Wait until the board renders with initial hypotheses
    await expect(page.getByRole("button", { name: /generate workspace/i })).toBeVisible();
    await page.getByRole("button", { name: /generate workspace/i }).click();
    await expect(page.getByRole("heading", { name: /validation board/i })).toBeVisible({ timeout: 30000 });
    const search = page.getByPlaceholder(/search/i);
    await expect(search).toBeVisible();
    // An exclusion term that matches nothing should hide all cards
    await search.fill("-__no_match_zzz__");
    await expect(page.locator("article")).toHaveCount(0);
    // Clear search; cards should come back
    await search.fill("");
    await expect.poll(async () => page.locator("article").count()).toBeGreaterThan(0);
  });

  test("slash key focuses search input", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /generate workspace/i })).toBeVisible();
    await page.getByRole("button", { name: /generate workspace/i }).click();
    await expect(page.getByRole("heading", { name: /validation board/i })).toBeVisible({ timeout: 30000 });
    // Click body to move focus out of any input
    await page.locator("body").click();
    await page.keyboard.press("/");
    const search = page.getByPlaceholder(/search/i);
    await expect(search).toBeFocused();
  });

  test("keyboard hint bar mentions slash and command palette", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /generate workspace/i })).toBeVisible();
    await page.getByRole("button", { name: /generate workspace/i }).click();
    await expect(page.getByRole("heading", { name: /validation board/i })).toBeVisible({ timeout: 30000 });
    await expect(page.locator("kbd").filter({ hasText: "/" })).toBeVisible();
    await expect(page.getByText(/command palette/i)).toBeVisible();
  });
});
