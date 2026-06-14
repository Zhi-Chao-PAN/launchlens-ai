import { OnboardingWizard } from "@/components/onboarding-wizard";
import { LaunchWorkspace } from "@/components/launch-workspace";
import { exampleWorkspaces } from "@/lib/launchlens/example-workspaces";

const initialExample = exampleWorkspaces[0];

export default function Home() {
  return (
    <>
      <OnboardingWizard />
      <LaunchWorkspace
        initialInput={initialExample.input}
        initialWorkspace={initialExample.workspace}
        initialExecution={initialExample.execution}
        exampleWorkspaces={exampleWorkspaces}
      />
    </>
  );
}
