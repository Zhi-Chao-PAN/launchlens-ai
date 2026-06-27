import { expect, test } from "@playwright/test";

test.describe("LaunchLens AI commercial readiness", () => {
  test("presents the productization stage and verification path", async ({
    page,
  }) => {
    await page.goto("/readiness");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /commercial\/productization readiness starts with proof/i,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: /the next phase is a staged/i }),
    ).toBeVisible();
    await expect(page.getByText("Identity and tenant model")).toBeVisible();
    await expect(page.getByText("Billing and plan limits")).toBeVisible();
    await expect(page.getByText("Onboarding and activation")).toBeVisible();
    await expect(page.getByText("Eval and ops visibility")).toBeVisible();
    await expect(
      page.getByText("npm run verify:commercial-readiness").first(),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: /read detailed plan/i }),
    ).toHaveAttribute(
      "href",
      "https://github.com/Zhi-Chao-PAN/launchlens-ai/blob/main/docs/COMMERCIAL_READINESS.md",
    );
    await expect(
      page.getByRole("link", { name: /view case study/i }),
    ).toHaveAttribute("href", "/case-study");
  });
});
