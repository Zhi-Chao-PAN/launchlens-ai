import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const eventMocks = vi.hoisted(() => ({
  neon: vi.fn(),
}));

vi.mock("@neondatabase/serverless", () => ({
  neon: eventMocks.neon,
}));

import {
  recordProductEvent,
  resetProductEventsForTests,
  summarizeProductFunnel,
  summarizeProductStage2Funnel,
} from "./product-events";

const ownerToken = "j".repeat(43);

describe("privacy-safe product events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = "postgres://product-events.test/db";
    resetProductEventsForTests();
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
    resetProductEventsForTests();
  });

  it("records only an allowlisted milestone against a hashed journey", async () => {
    const sql = vi.fn(async () => []);
    eventMocks.neon.mockReturnValue(sql);
    const subjectKey = "research-session-123";

    await expect(
      recordProductEvent({
        ownerToken,
        eventName: "workspace_generation_started",
        subjectKey,
        provider: "minimax",
        mode: "real",
      }),
    ).resolves.toBe(true);

    expect(sql).toHaveBeenCalledTimes(1);
    const values = sql.mock.calls[0].slice(1);
    expect(values).not.toContain(ownerToken);
    expect(values).not.toContain(subjectKey);
    expect(values).toContain("workspace_generation_started");
    expect(values).toContain("minimax");
    expect(values).toContain("real");
    expect(
      values.filter(
        (value) =>
          typeof value === "string" && /^[a-f0-9]{64}$/.test(value),
      ),
    ).toHaveLength(2);
  });

  it("hashes Stage 2 tracking labels before inserting analytics", async () => {
    const sql = vi.fn(async () => []);
    eventMocks.neon.mockReturnValue(sql);

    await expect(
      recordProductEvent({
        ownerToken,
        eventName: "workspace_generation_started",
        subjectKey: "research-session-123",
        stage2: {
          stage2Participant: "P01",
          stage2Batch: "pilot-1",
        },
      }),
    ).resolves.toBe(true);

    const values = sql.mock.calls[0].slice(1);
    expect(values).not.toContain(ownerToken);
    expect(values).not.toContain("research-session-123");
    expect(values).not.toContain("P01");
    expect(values).not.toContain("pilot-1");
    expect(
      values.filter(
        (value) =>
          typeof value === "string" && /^[a-f0-9]{64}$/.test(value),
      ),
    ).toHaveLength(4);
  });

  it("skips analytics when cloud storage or a valid journey is absent", async () => {
    delete process.env.DATABASE_URL;

    await expect(
      recordProductEvent({
        ownerToken,
        eventName: "workspace_generation_started",
      }),
    ).resolves.toBe(false);

    process.env.DATABASE_URL = "postgres://product-events.test/db";
    resetProductEventsForTests();
    eventMocks.neon.mockReturnValue(vi.fn(async () => []));
    await expect(
      recordProductEvent({
        ownerToken: "",
        eventName: "workspace_generation_started",
      }),
    ).resolves.toBe(false);
  });

  it("summarizes distinct journeys into completion and handoff rates", async () => {
    eventMocks.neon.mockReturnValue(
      vi.fn(async () => [
        {
          started: 10,
          completed: 8,
          handoff: 4,
          saved: 3,
          shared: 2,
        },
      ]),
    );

    await expect(summarizeProductFunnel(30)).resolves.toEqual({
      configured: true,
      windowDays: 30,
      started: 10,
      completed: 8,
      handoff: 4,
      saved: 3,
      shared: 2,
      completionRate: 0.8,
      handoffRate: 0.5,
    });
  });

  it("summarizes Stage 2 product journeys with hashed labels", async () => {
    const sql = vi.fn(async () => [
      {
        started: 4,
        completed: 3,
        handoff: 2,
        saved: 2,
        shared: 1,
      },
    ]);
    eventMocks.neon.mockReturnValue(sql);

    await expect(
      summarizeProductStage2Funnel(
        { stage2Participant: "P01", stage2Batch: "pilot-1" },
        14,
      ),
    ).resolves.toEqual({
      configured: true,
      windowDays: 14,
      started: 4,
      completed: 3,
      handoff: 2,
      saved: 2,
      shared: 1,
      completionRate: 0.75,
      handoffRate: 0.6667,
      stage2ParticipantTracked: true,
      stage2BatchTracked: true,
    });

    const values = sql.mock.calls[0].slice(1);
    expect(values).not.toContain("P01");
    expect(values).not.toContain("pilot-1");
    expect(
      values.filter(
        (value) =>
          typeof value === "string" && /^[a-f0-9]{64}$/.test(value),
      ),
    ).toHaveLength(2);
  });
});
