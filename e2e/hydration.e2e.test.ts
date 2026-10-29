import { expect, test } from "@playwright/test";

for (const [platform, modifier] of [
  ["MacIntel", "Cmd"],
  ["Win32", "Ctrl"],
  ["Linux x86_64", "Ctrl"],
]) {
  test(`first visit hydrates without errors for ${platform}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    // Emulate the platform signal, independently of the CI host. A Linux
    // browser on a Linux build would miss the production Mac hydration bug.
    await page.addInitScript(value => {
      Object.defineProperty(navigator, "platform", { get: () => value });
    }, platform);
    await page.goto("/");
    await expect(page.getByRole("dialog", { name: /quick start guide/i })).toBeVisible();
    await page.getByRole("button", { name: /get started/i }).click();
    await expect(page.locator("#founder-brief-idea-hint")).toHaveText(
      `Use ${modifier} + Enter to generate.`,
    );
    await expect(page.getByRole("button", { name: "B2B SaaS activation", exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
