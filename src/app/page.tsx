import { LaunchWorkspace } from "@/components/launch-workspace";
import { buildMockWorkspace } from "@/lib/launchlens/mock-provider";
import { sampleBriefs } from "@/lib/launchlens/sample-briefs";

const initialInput = sampleBriefs[0].input;

export default function Home() {
  const initialWorkspace = buildMockWorkspace(initialInput);

  return (
    <LaunchWorkspace
      initialInput={initialInput}
      initialWorkspace={initialWorkspace}
      sampleBriefs={sampleBriefs}
    />
  );
}
