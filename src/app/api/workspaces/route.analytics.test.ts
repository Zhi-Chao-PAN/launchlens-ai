import { beforeEach, describe, expect, it, vi } from "vitest";

const analyticsMocks = vi.hoisted(() => ({
  createWorkspace: vi.fn(),
  recordProductEvent: vi.fn(),
}));

vi.mock("@/lib/launchlens/workspace-store", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/lib/launchlens/workspace-store")
  >()),
  createWorkspace: analyticsMocks.createWorkspace,
}));

vi.mock("@/lib/launchlens/product-events", () => ({
  recordProductEvent: analyticsMocks.recordProductEvent,
}));

import { exampleWorkspaces } from "@/lib/launchlens/example-workspaces";
import { resetWorkspaceRateLimitsForTests } from "@/lib/launchlens/workspace-api";
import { POST } from "./route";

const ownerToken = "s".repeat(43);

describe("/api/workspaces product events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetWorkspaceRateLimitsForTests();
    analyticsMocks.recordProductEvent.mockResolvedValue(true);
  });

  it("records a cloud handoff after a valid snapshot is stored", async () => {
    const example = exampleWorkspaces[0];
    analyticsMocks.createWorkspace.mockResolvedValue({
      id: "4b5cf786-923d-4dd9-9f05-c10fe7fbe212",
      title: "Activation workspace",
      input: example.input,
      workspace: example.workspace,
      execution: example.execution,
    });

    const response = await POST(
      new Request("http://localhost/api/workspaces", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-launchlens-owner": ownerToken,
        },
        body: JSON.stringify({
          title: "Activation workspace",
          input: example.input,
          workspace: example.workspace,
          execution: example.execution,
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(analyticsMocks.recordProductEvent).toHaveBeenCalledWith({
      ownerToken,
      eventName: "cloud_snapshot_saved",
      subjectKey: "4b5cf786-923d-4dd9-9f05-c10fe7fbe212",
    });
  });

  it("carries Stage 2 context into the cloud handoff event", async () => {
    const example = exampleWorkspaces[0];
    analyticsMocks.createWorkspace.mockResolvedValue({
      id: "4b5cf786-923d-4dd9-9f05-c10fe7fbe212",
      title: "Activation workspace",
      input: example.input,
      workspace: example.workspace,
      execution: example.execution,
    });

    const response = await POST(
      new Request("http://localhost/api/workspaces", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-launchlens-owner": ownerToken,
          "x-launchlens-stage2-participant": "P01",
          "x-launchlens-stage2-batch": "pilot-1",
        },
        body: JSON.stringify({
          title: "Activation workspace",
          input: example.input,
          workspace: example.workspace,
          execution: example.execution,
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(analyticsMocks.recordProductEvent).toHaveBeenCalledWith({
      ownerToken,
      eventName: "cloud_snapshot_saved",
      subjectKey: "4b5cf786-923d-4dd9-9f05-c10fe7fbe212",
      stage2: {
        stage2Participant: "P01",
        stage2Batch: "pilot-1",
      },
    });
  });
});
