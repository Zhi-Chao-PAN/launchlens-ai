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
    await expect(quickStart).toHaveCount(0);
  }
}

async function gotoHomeReady(page: Page): Promise<void> {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /go-to-market workspace/i }),
  ).toBeVisible();
  await dismissQuickStart(page);
}

function shortcutsDialog(page: Page) {
  return page.getByRole("dialog", { name: /keyboard shortcuts/i });
}

function systemStatusDialog(page: Page) {
  return page.getByRole("dialog", { name: /system status details/i });
}

test.describe("Keyboard shortcuts", () => {
  test("Shift+? opens the shortcuts dialog, Escape closes it", async ({
    page,
  }) => {
    await gotoHomeReady(page);

    await expect(shortcutsDialog(page)).toHaveCount(0);
    await page.keyboard.press("Shift+?");
    const dialog = shortcutsDialog(page);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Actions" })).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "Navigation" }),
    ).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(shortcutsDialog(page)).toHaveCount(0);
  });

  test("? help button is visible and enabled", async ({ page }) => {
    await gotoHomeReady(page);

    const helpButton = page.getByRole("button", {
      name: /show keyboard shortcuts/i,
    });
    await expect(helpButton).toBeVisible();
    await expect(helpButton).toBeEnabled();
  });

  test("/ focuses validation search and Ctrl+K opens command palette", async ({
    page,
  }) => {
    await gotoHomeReady(page);

    await page.locator("body").click();
    await page.keyboard.press("/");
    await expect(page.getByPlaceholder(/search/i)).toBeFocused();

    await page.locator("body").click();
    await page.keyboard.press("Control+k");
    const palette = page.getByRole("dialog", { name: /command palette/i });
    await expect(palette).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(palette).toHaveCount(0);
  });
});

test.describe("Toast notifications", () => {
  test("copy Markdown action shows a dismissible toast", async ({ page }) => {
    await gotoHomeReady(page);

    await page.getByRole("button", { name: /copy.*markdown/i }).click();
    await expect(page.getByText(/markdown copied to clipboard/i)).toBeVisible();

    await page.keyboard.press("Escape");
  });
});

test.describe("System status", () => {
  test("system status dialog opens and Escape closes it", async ({ page }) => {
    await gotoHomeReady(page);

    await page.getByRole("button", { name: /system status/i }).click();
    const panel = systemStatusDialog(page);
    await expect(panel).toBeVisible();
    await expect(panel.getByText("AI Provider")).toBeVisible();
    await expect(panel.getByText("Cloud storage")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
  });

  test("clicking outside system status closes the dialog", async ({ page }) => {
    await gotoHomeReady(page);

    await page.getByRole("button", { name: /system status/i }).click();
    const panel = systemStatusDialog(page);
    await expect(panel).toBeVisible();

    await page.getByRole("heading", { name: /go-to-market workspace/i }).click();
    await expect(panel).toHaveCount(0);
  });
});

test.describe("Onboarding wizard", () => {
  test("can be dismissed and replayed from the header", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("launchlens-onboarding-dismissed");
    });
    await page.reload();

    const dialog = page.getByRole("dialog", { name: /quick start guide/i });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /dismiss/i }).click();
    await expect(dialog).toHaveCount(0);

    await page.getByRole("button", { name: /replay quick start tour/i }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Welcome to LaunchLens AI")).toBeVisible();
  });

  test("Ctrl+H reopens the quick start guide", async ({ page }) => {
    await gotoHomeReady(page);

    await page.keyboard.press("Control+h");
    await expect(
      page.getByRole("dialog", { name: /quick start guide/i }),
    ).toBeVisible();
  });
});

test.describe("Founder brief shortcut", () => {
  test("Ctrl+Enter in product idea triggers workspace generation", async ({
    page,
  }) => {
    await gotoHomeReady(page);

    await page.locator("#founder-brief-idea").fill(
      "A focused activation analytics product for small SaaS teams.",
    );
    await page.keyboard.press("Control+Enter");

    await expect(
      page.getByRole("region", { name: /validation loop/i }),
    ).toBeVisible({ timeout: 30_000 });
  });
});
