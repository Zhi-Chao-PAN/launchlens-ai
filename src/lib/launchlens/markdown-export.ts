import type { LaunchLensWorkspace } from "./types";
import {
  taskIdentity,
  type WorkspaceExecutionState,
} from "./execution";

function bullets(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

export function workspaceToMarkdown(
  workspace: LaunchLensWorkspace,
  execution?: WorkspaceExecutionState,
) {
  const backlog = workspace.backlog
    .map((item) => `- **${item.priority} ${item.feature}**: ${item.why}`)
    .join("\n");
  const content = workspace.contentCalendar
    .map(
      (item) =>
        `- **${item.channel}** (${item.cadence}): ${item.angle}`,
    )
    .join("\n");
  const tasks = workspace.tasks
    .map(
      (task) =>
        `- **${task.title}** | ${task.owner} | ${task.due} | ${task.outcome}`,
    )
    .join("\n");
  const validation = execution
    ? execution.experiments
        .map((experiment, index) => {
          const linkedTask = workspace.tasks.find(
            (task, taskIndex) =>
              taskIdentity(task, taskIndex) === experiment.linkedTaskId,
          );
          const evidence =
            experiment.evidence.length > 0
              ? experiment.evidence
                  .map(
                    (item) =>
                      `  - ${item.signal}: ${item.note} (${item.source}, ${item.observedAt})`,
                  )
                  .join("\n")
              : "  - No evidence recorded";

          return `### H${index + 1}: ${experiment.assumption}

- Status: ${experiment.status}
- Confidence: ${experiment.confidence}
- Decision: ${experiment.decision || "Pending"}
- Next action: ${experiment.nextAction || "Pending"}
- Linked task: ${linkedTask?.title ?? "None"}
- Evidence:
${evidence}`;
        })
        .join("\n\n")
    : "";

  return `# ${workspace.landingPage.headline}

Generated with ${workspace.provider} provider on ${workspace.generatedAt}.

## Summary

${workspace.summary}

## Target Users

${bullets(workspace.targetUsers)}

## Pain Points

${bullets(workspace.pains)}

## MVP Scope

${bullets(workspace.mvpScope)}

## Feature Backlog

${backlog}

## Landing Page Copy

${workspace.landingPage.subheadline}

CTA: ${workspace.landingPage.cta}

${bullets(workspace.landingPage.proofBullets)}

## Pricing Hypothesis

${workspace.pricing.hypothesis}

${bullets(workspace.pricing.tiers)}

## Pricing Risks

${bullets(workspace.pricing.risks)}

## Launch Plan

${bullets(workspace.launchPlan)}

## Content Calendar

${content}

## Execution Tasks

${tasks}

## Assumptions To Validate

${bullets(workspace.assumptions)}

${validation ? `## Validation Decisions\n\n${validation}\n` : ""}
`;
}
