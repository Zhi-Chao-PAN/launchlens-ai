import { LaunchWorkspace } from "@/components/launch-workspace";
import { buildMockWorkspace } from "@/lib/launchlens/mock-provider";
import type { LaunchLensInput } from "@/lib/launchlens/types";

const initialInput: LaunchLensInput = {
  idea: "A lightweight AI workspace that turns raw SaaS ideas into launch-ready go-to-market plans.",
  audience: "Indie hackers, solo founders, and tiny product teams who need sharper execution before building.",
  market: "Early-stage SaaS products, micro-SaaS experiments, and AI-enabled productivity tools.",
  tone: "Practical, crisp, and founder-friendly",
  constraints:
    "Assume the user has a small budget, limited engineering time, and needs a demoable MVP in two weeks.",
};

export default function Home() {
  const initialWorkspace = buildMockWorkspace(initialInput);

  return (
    <LaunchWorkspace
      initialInput={initialInput}
      initialWorkspace={initialWorkspace}
    />
  );
}
