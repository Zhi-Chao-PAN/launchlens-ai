import { buildMockWorkspace } from "./mock-provider";
import { sampleBriefs } from "./sample-briefs";
import type { LaunchLensInput, LaunchLensWorkspace } from "./types";

export type ExampleWorkspace = {
  id: string;
  label: string;
  input: LaunchLensInput;
  workspace: LaunchLensWorkspace;
};

const generatedAtById: Record<string, string> = {
  "activation-analyst": "2026-06-12T04:35:00.000Z",
  "clinic-admin": "2026-06-12T04:36:00.000Z",
  "creator-commerce": "2026-06-12T04:37:00.000Z",
};

export const exampleWorkspaces: ExampleWorkspace[] = sampleBriefs.map(
  (sample) => ({
    id: sample.id,
    label: sample.label,
    input: sample.input,
    workspace: {
      ...buildMockWorkspace(sample.input),
      generatedAt: generatedAtById[sample.id] ?? "2026-06-12T04:35:00.000Z",
    },
  }),
);
