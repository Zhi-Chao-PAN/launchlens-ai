import { afterEach, describe, expect, it } from "vitest";

import { GET } from "./route";

describe("/api/commercial/entitlements", () => {
  afterEach(() => {
    delete process.env.LAUNCHLENS_COMMERCIAL_PLAN;
    delete process.env.NEXT_PUBLIC_LAUNCHLENS_COMMERCIAL_PLAN;
  });

  it("returns the default Team preview entitlement without caching", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      entitlement: {
        activePlanId: "team",
        activePlanName: "Team preview",
        limits: {
          cloudSnapshots: 20,
          tenantsPerOwner: 5,
          membersPerWorkspace: 10,
        },
      },
    });
  });

  it("resolves the server-side commercial plan override", async () => {
    process.env.LAUNCHLENS_COMMERCIAL_PLAN = "solo";

    const response = await GET();

    await expect(response.json()).resolves.toMatchObject({
      entitlement: {
        activePlanId: "solo",
        activePlanName: "Solo preview",
        limits: {
          tenantsPerOwner: 1,
          membersPerWorkspace: 1,
        },
      },
    });
  });

  it("falls back to the default when an unknown plan is configured", async () => {
    process.env.LAUNCHLENS_COMMERCIAL_PLAN = "enterprise";

    const response = await GET();

    await expect(response.json()).resolves.toMatchObject({
      entitlement: {
        activePlanId: "team",
      },
      catalog: expect.arrayContaining([
        expect.objectContaining({ id: "free" }),
        expect.objectContaining({ id: "solo" }),
        expect.objectContaining({ id: "team" }),
      ]),
    });
  });
});
