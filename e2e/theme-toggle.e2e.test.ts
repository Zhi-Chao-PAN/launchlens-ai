import { expect, test } from "@playwright/test";

test.describe("Dark mode toggle", () => {
  test("theme toggle button is present and clickable on the home page", async ({
    page,
  }) => {
    await page.goto("/");

    const toggle = page.getByRole("button", { name: /toggle theme/i });
    await expect(toggle).toBeVisible();
    await expect(toggle).toBeEnabled();
  });

  test("clicking theme toggle switches between light and dark modes", async ({
    page,
  }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: /toggle theme/i });

    // Get initial theme
    const initialTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );

    // Toggle once
    await toggle.click();
    const afterFirst = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    expect(afterFirst).not.toBe(initialTheme);

    // Toggle again
    await toggle.click();
    const afterSecond = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    expect(afterSecond).toBe(initialTheme);
  });

  test("theme preference persists across page reloads", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: /toggle theme/i });

    // Toggle to the opposite of current
    const before = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    await toggle.click();

    // Reload
    await page.reload();
    const afterReload = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );

    // Should be the toggled theme, not the original
    expect(afterReload).not.toBe(before);
  });

  test("theme toggle respects system preference on first visit", async ({
    page,
  }) => {
    // Emulate dark color scheme
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");

    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    // On first visit with no localStorage, should follow system (dark)
    expect(theme).toBe("dark");
  });
});
