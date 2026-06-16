import { expect, test } from "@playwright/test";

test.describe("Keyboard shortcuts", () => {
  test("Shift+? opens the shortcuts modal, Escape closes it", async ({ page }) => {
    await page.goto("/");

    // Modal is not visible initially
    await expect(
      page.getByRole("dialog", { name: /keyboard shortcuts/i }),
    ).toHaveCount(0);

    // Press Shift+? to open shortcuts
    await page.keyboard.press("Shift+?");
    await expect(
      page.getByRole("dialog", { name: /keyboard shortcuts/i }),
    ).toBeVisible();

    // Verify shortcut categories are listed
    await expect(page.getByText("Actions")).toBeVisible();
    await expect(page.getByText("Navigation")).toBeVisible();

    // Press Escape to close
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("dialog", { name: /keyboard shortcuts/i }),
    ).toHaveCount(0);
  });

  test("? help button is visible and opens the modal on click", async ({ page }) => {
    await page.goto("/");

    // The floating help button is at bottom-left (aria-label)
    const helpButton = page.getByRole("button", { name: /show keyboard shortcuts/i });
    await expect(helpButton).toBeVisible();
    await helpButton.click();

    await expect(
      page.getByRole("dialog", { name: /keyboard shortcuts/i }),
    ).toBeVisible();

    // Click the X button to close
    await page
      .getByRole("dialog", { name: /keyboard shortcuts/i })
      .getByRole("button", { name: /close/i })
      .click();

    await expect(
      page.getByRole("dialog", { name: /keyboard shortcuts/i }),
    ).toHaveCount(0);
  });

  test("clicking backdrop closes shortcuts modal", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Shift+?");
    const dialog = page.getByRole("dialog", { name: /keyboard shortcuts/i });
    await expect(dialog).toBeVisible();

    // Click outside the dialog (on the backdrop)
    await page.mouse.click(10, 10);
    await expect(dialog).toHaveCount(0);
  });
});

test.describe("Toast notifications", () => {
  test("copy Markdown action shows a toast that can be dismissed", async ({ page }) => {
    await page.goto("/");

    // Wait for hydration to settle
    await page.waitForLoadState("networkidle");

    // Dismiss onboarding if it appears
    const onboarding = page.getByRole("dialog", { name: /quick start guide/i });
    if (await onboarding.isVisible().catch(() => false)) {
      await onboarding.getByRole("button", { name: /get started/i }).click();
      await expect(onboarding).toHaveCount(0);
    }

    // Find and click the "Copy Markdown" button
    const copyMdButton = page.getByRole("button", { name: /copy.*markdown/i });
    await expect(copyMdButton).toBeVisible();
    await copyMdButton.click();

    // A toast should appear (status role for success/info)
    const toastRegion = page.locator('[aria-live="polite"]');
    await expect(toastRegion).toBeVisible();

    // Dismiss the toast via Escape
    await page.keyboard.press("Escape");
  });
});

test.describe("System status", () => {
  test("system status button opens dropdown, Escape closes it", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Dismiss onboarding if visible
    const onboarding = page.getByRole("dialog", { name: /quick start guide/i });
    if (await onboarding.isVisible().catch(() => false)) {
      await page.getByRole("button", { name: /get started/i }).click();
    }

    const statusButton = page.getByRole("button", { name: /system status/i });
    // Might initially say "Checking..."
    await expect(statusButton).toBeVisible();
    await statusButton.click();

    // Status panel appears (tooltip role)
    const panel = page.getByRole("tooltip");
    await expect(panel).toBeVisible();
    await expect(page.getByText("AI Provider")).toBeVisible();
    await expect(page.getByText("Cloud storage")).toBeVisible();

    // Escape closes it via shared event
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
  });
});

test.describe("Onboarding wizard", () => {
  test("can be dismissed with X button, Escape, or click outside", async ({ page }) => {
    // Reset onboarding state by clearing localStorage before navigation
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("launchlens-onboarding-dismissed");
    });
    await page.reload();

    const dialog = page.getByRole("dialog", { name: /quick start guide/i });
    await expect(dialog).toBeVisible();

    // Click the X close button
    await dialog.getByRole("button", { name: /dismiss/i }).click();
    await expect(dialog).toHaveCount(0);
  });
});


  test("/ and Ctrl+K also open the shortcuts modal (command-palette convention)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Dismiss onboarding if visible
    const onboarding = page.getByRole("dialog", { name: /quick start guide/i });
    if (await onboarding.isVisible().catch(() => false)) {
      await onboarding.getByRole("button", { name: /get started/i }).click();
    }

    // Press "/" to open (unshifted)
    await page.keyboard.press("/");
    await expect(
      page.getByRole("dialog", { name: /keyboard shortcuts/i }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("dialog", { name: /keyboard shortcuts/i }),
    ).toHaveCount(0);

    // Press Ctrl+K to open
    await page.keyboard.press("Control+k");
    await expect(
      page.getByRole("dialog", { name: /keyboard shortcuts/i }),
    ).toBeVisible();
    await page.mouse.click(10, 10); // backdrop click closes
    await expect(
      page.getByRole("dialog", { name: /keyboard shortcuts/i }),
    ).toHaveCount(0);
  });

test.describe("Replay tour button", () => {
  test("Tour button in header re-opens onboarding wizard", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Dismiss onboarding if visible
    const onboarding = page.getByRole("dialog", { name: /quick start guide/i });
    if (await onboarding.isVisible().catch(() => false)) {
      await onboarding.getByRole("button", { name: /get started/i }).click();
      await expect(onboarding).toHaveCount(0);
    }

    // Click the Tour button
    const tourBtn = page.getByRole("button", { name: /replay quick start tour/i });
    await expect(tourBtn).toBeVisible();
    await tourBtn.click();

    const reopened = page.getByRole("dialog", { name: /quick start guide/i });
    await expect(reopened).toBeVisible();
    await expect(reopened.getByText("Welcome to LaunchLens AI")).toBeVisible();

    // Keyboard shortcut Ctrl+H also reopens
    await page.keyboard.press("Escape");
    await expect(reopened).toHaveCount(0);
    await page.keyboard.press("Control+h");
    await expect(
      page.getByRole("dialog", { name: /quick start guide/i }),
    ).toBeVisible();
  });
});

test.describe("System status outside click", () => {
  test("clicking outside status dropdown closes it", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const onboarding = page.getByRole("dialog", { name: /quick start guide/i });
    if (await onboarding.isVisible().catch(() => false)) {
      await onboarding.getByRole("button", { name: /get started/i }).click();
    }

    const statusButton = page.getByRole("button", { name: /system status/i });
    await statusButton.click();
    const panel = page.getByRole("tooltip");
    await expect(panel).toBeVisible();

    // Click outside
    await page.mouse.click(10, 10);
    await expect(panel).toHaveCount(0);
  });
});

test.describe("Cmd/Ctrl+Enter in brief textarea", () => {
  test("Ctrl+Enter in product-idea textarea triggers Generate", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const onboarding = page.getByRole("dialog", { name: /quick start guide/i });
    if (await onboarding.isVisible().catch(() => false)) {
      await onboarding.getByRole("button", { name: /get started/i }).click();
    }

    const idea = page.locator("#founder-brief-idea");
    await idea.click();
    await idea.fill("A small test product");
    await page.keyboard.press("Control+Enter");

    // Generate button should now show "Generating..."
    await expect(page.getByRole("button", { name: /generating/i })).toBeVisible();
  });
});
