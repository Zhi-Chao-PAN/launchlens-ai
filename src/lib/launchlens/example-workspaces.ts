import { buildMockWorkspace } from "./mock-provider";
import {
  createExecutionState,
  type WorkspaceExecutionState,
} from "./execution";
import { sampleBriefs } from "./sample-briefs";
import type { LaunchLensInput, LaunchLensWorkspace } from "./types";

export type ExampleWorkspace = {
  id: string;
  label: string;
  input: LaunchLensInput;
  workspace: LaunchLensWorkspace;
  execution: WorkspaceExecutionState;
};

const generatedAtById: Record<string, string> = {
  "activation-analyst": "2026-06-12T04:35:00.000Z",
  "clinic-admin": "2026-06-12T04:36:00.000Z",
  "creator-commerce": "2026-06-12T04:37:00.000Z",
};

export const exampleWorkspaces: ExampleWorkspace[] = sampleBriefs.map(
  (sample) => {
    const workspace: LaunchLensWorkspace = {
      ...buildMockWorkspace(sample.input),
      generatedAt: generatedAtById[sample.id] ?? "2026-06-12T04:35:00.000Z",
    };
    const execution = createExecutionState(workspace);

    if (sample.id === "activation-analyst") {
      execution.experiments[0] = {
        ...execution.experiments[0],
        status: "supported",
        confidence: "high",
        decision:
          "Keep weekly activation-fix recommendations in the MVP and defer predictive churn scoring.",
        nextAction:
          "Test whether founders will upload support notes before connecting a help-desk integration.",
        evidence: [
          {
            id: "activation-interviews",
            source: "5 founder interviews",
            signal: "supports",
            observedAt: "2026-06-12T05:10:00.000Z",
            note: "Four founders preferred a weekly prioritized fix list over another analytics dashboard.",
          },
          {
            id: "activation-prototype",
            source: "Prototype walkthrough",
            signal: "supports",
            observedAt: "2026-06-12T05:25:00.000Z",
            note: "Three founders identified a real onboarding change within ten minutes.",
          },
        ],
      };
    }

    if (sample.id === "clinic-admin") {
      execution.experiments[0] = {
        ...execution.experiments[0],
        status: "testing",
        confidence: "medium",
        nextAction:
          "Run two privacy-reviewed shadow sessions with clinic administrators.",
        evidence: [
          {
            id: "clinic-shadowing",
            source: "Clinic workflow shadowing",
            signal: "neutral",
            observedAt: "2026-06-12T05:20:00.000Z",
            note: "Administrators valued draft assistance but required explicit human approval before any schedule change.",
          },
        ],
      };
    }

    if (sample.id === "creator-commerce") {
      execution.experiments[0] = {
        ...execution.experiments[0],
        status: "refuted",
        confidence: "medium",
        decision:
          "Drop automated campaign generation from the first release and focus on offer validation.",
        nextAction:
          "Test three offer-positioning variants with a ten-creator waitlist.",
        evidence: [
          {
            id: "creator-message-test",
            source: "Landing-page message test",
            signal: "challenges",
            observedAt: "2026-06-12T05:30:00.000Z",
            note: "Creators clicked the offer-validation message twice as often as the automated-campaign message.",
          },
        ],
      };
    }

    return {
      id: sample.id,
      label: sample.label,
      input: sample.input,
      workspace,
      execution,
    };
  },
);
