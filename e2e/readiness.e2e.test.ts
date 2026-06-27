import { expect, test } from "@playwright/test";

test.describe("LaunchLens AI commercial readiness", () => {
  test("presents the productization stage and verification path", async ({
    page,
  }) => {
    await page.goto("/readiness");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /commercial\/productization readiness connects proof/i,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: /the next phase is a staged/i }),
    ).toBeVisible();
    await expect(page.getByText("Identity and tenant model")).toBeVisible();
    await expect(page.getByText("Billing and plan limits")).toBeVisible();
    await expect(
      page.getByText("Entitlement Contract", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Team preview").first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: "/api/commercial/entitlements" }),
    ).toHaveAttribute("href", "/api/commercial/entitlements");
    await expect(
      page.getByRole("link", { name: "Open Billing" }),
    ).toHaveAttribute("href", "/billing");
    await expect(
      page.getByRole("link", { name: "/api/commercial/subscription" }),
    ).toHaveAttribute("href", "/api/commercial/subscription");
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

  test("exposes reviewer-safe commercial entitlement data", async ({
    request,
  }) => {
    const response = await request.get("/api/commercial/entitlements");
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toMatch(/no-store/i);

    const body = (await response.json()) as {
      entitlement?: {
        activePlanId?: string;
        limits?: {
          cloudSnapshots?: number;
          tenantsPerOwner?: number;
          membersPerWorkspace?: number;
        };
      };
    };

    expect(body.entitlement).toMatchObject({
      activePlanId: "team",
      limits: {
        cloudSnapshots: 20,
        tenantsPerOwner: 5,
        membersPerWorkspace: 10,
      },
    });
  });

  test("shows the operational billing surface without exposing provider ids", async ({
    page,
  }) => {
    await page.goto("/billing");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Subscription and plan access",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Team preview" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Choose a recurring subscription" }),
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/cus_|sub_|sk_|whsec_/);
  });
});
