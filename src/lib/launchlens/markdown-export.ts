import type { LaunchLensWorkspace } from "./types";

function bullets(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

export function workspaceToMarkdown(workspace: LaunchLensWorkspace) {
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
`;
}
