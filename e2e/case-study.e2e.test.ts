import { expect, test } from "@playwright/test";

test.describe("LaunchLens AI public case study", () => {
  test("connects the reviewer evidence page to the product and verification trail", async ({
    page,
  }) => {
    await page.goto("/case-study");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /turns founder ideas into evidence-grounded GTM decisions/i,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("img", {
        name: /desktop workspace showing the go-to-market plan/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: /mobile workspace/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: /what a reviewer should inspect/i }),
    ).toBeVisible();
    await expect(page.getByText("npm run verify:portfolio").first()).toBeVisible();
    await expect(
      page.getByText("npm run verify:production-demo").first(),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: /open product/i }).first(),
    ).toHaveAttribute("href", "/");
    await expect(
      page.getByRole("link", { name: /read written case study/i }),
    ).toHaveAttribute(
      "href",
      "https://github.com/Zhi-Chao-PAN/launchlens-ai/blob/main/docs/PORTFOLIO_CASE_STUDY.md",
    );
    await expect(
      page.getByRole("link", { name: /view verification/i }),
    ).toHaveAttribute(
      "href",
      "https://github.com/Zhi-Chao-PAN/launchlens-ai/actions",
    );
  });
});
