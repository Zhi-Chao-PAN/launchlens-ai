import { expect, test, type Locator, type Page } from "@playwright/test";

const THEME_STORAGE_KEY = "launchlens:theme";

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

function themeToggle(page: Page) {
  return page.getByRole("button", {
    name: /(theme|mode) \(click to cycle\)/i,
  });
}

async function gotoHomeReady(page: Page) {
  await page.goto("/");
  await dismissQuickStart(page);
  await expect(themeToggle(page)).toBeVisible({ timeout: 10_000 });
  await expect
    .poll(() =>
      page.evaluate((themeStorageKey) => ({
        dataTheme: document.documentElement.getAttribute("data-theme"),
        stored: localStorage.getItem(themeStorageKey),
      }), THEME_STORAGE_KEY),
    )
    .toMatchObject({ stored: "system" });
}

async function currentThemeState(page: Page) {
  return page.evaluate((themeStorageKey) => ({
    dataTheme: document.documentElement.getAttribute("data-theme"),
    stored: localStorage.getItem(themeStorageKey),
    colorScheme: document.documentElement.style.colorScheme,
  }), THEME_STORAGE_KEY);
}

test.describe("Theme toggle", () => {
  test("theme toggle button is present and clickable on the home page", async ({
    page,
  }) => {
    await gotoHomeReady(page);

    const toggle = themeToggle(page);
    await expect(toggle).toBeVisible();
    await expect(toggle).toBeEnabled();
  });

  test("clicking theme toggle cycles saved preferences", async ({ page }) => {
    await gotoHomeReady(page);
    const toggle = themeToggle(page);

    await toggle.click();
    await expect
      .poll(() => currentThemeState(page))
      .toMatchObject({ stored: "light", dataTheme: "light" });

    await toggle.click();
    await expect
      .poll(() => currentThemeState(page))
      .toMatchObject({ stored: "dark", dataTheme: "dark" });

    await toggle.click();
    await expect
      .poll(() => currentThemeState(page))
      .toMatchObject({ stored: "system" });
  });

  test("theme preference persists across page reloads", async ({ page }) => {
    await gotoHomeReady(page);
    const toggle = themeToggle(page);

    await toggle.click();
    await toggle.click();
    await expect
      .poll(() => currentThemeState(page))
      .toMatchObject({ stored: "dark", dataTheme: "dark" });

    await page.reload();
    await expect(themeToggle(page)).toBeVisible({ timeout: 10_000 });
    await expect
      .poll(() => currentThemeState(page))
      .toMatchObject({ stored: "dark", dataTheme: "dark" });
  });

  test("theme toggle respects system preference on first visit", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await gotoHomeReady(page);

    await expect
      .poll(() => currentThemeState(page))
      .toMatchObject({ stored: "system", dataTheme: "dark" });
  });
});
