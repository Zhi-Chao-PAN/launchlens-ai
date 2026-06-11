import type {
  BacklogItem,
  ContentItem,
  LaunchLensInput,
  LaunchLensWorkspace,
  LaunchTask,
  ProviderName,
} from "./types";

function compact(value: string, fallback: string) {
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : fallback;
}

function shortIdea(input: LaunchLensInput) {
  const idea = compact(input.idea, "an AI-powered SaaS launch workspace");
  return idea.length > 110 ? `${idea.slice(0, 107)}...` : idea;
}

export function buildMockWorkspace(
  input: LaunchLensInput,
  provider: ProviderName = "mock",
): LaunchLensWorkspace {
  const idea = shortIdea(input);
  const audience = compact(
    input.audience,
    "indie founders and small teams validating a SaaS product",
  );
  const market = compact(input.market, "early-stage B2B SaaS");
  const constraints = compact(
    input.constraints,
    "ship a focused MVP before expanding scope",
  );

  const backlog: BacklogItem[] = [
    {
      feature: "Idea intake and positioning brief",
      why: "Captures the raw founder context before the AI creates a plan.",
      priority: "P0",
    },
    {
      feature: "GTM workspace generator",
      why: "Transforms the brief into users, pains, MVP scope, pricing, and launch tasks.",
      priority: "P0",
    },
    {
      feature: "Editable launch board",
      why: "Lets users turn AI output into owned execution work instead of static text.",
      priority: "P1",
    },
    {
      feature: "Evidence tracker",
      why: "Connects assumptions to interviews, waitlist data, and content signals.",
      priority: "P2",
    },
  ];

  const contentCalendar: ContentItem[] = [
    {
      channel: "LinkedIn",
      angle: "Build-in-public teardown of the customer pain",
      cadence: "2 posts per week",
    },
    {
      channel: "Product Hunt",
      angle: "Launch story focused on speed from idea to first test",
      cadence: "Launch week",
    },
    {
      channel: "Founder newsletter",
      angle: "Practical checklist for validating a tiny SaaS",
      cadence: "Weekly",
    },
  ];

  const tasks: LaunchTask[] = [
    {
      title: "Interview 5 target users",
      owner: "Founder",
      due: "Day 2",
      outcome: "Pain language and buying triggers",
    },
    {
      title: "Publish a one-page landing page",
      owner: "Builder",
      due: "Day 4",
      outcome: "Waitlist and message testing",
    },
    {
      title: "Prototype the workspace export",
      owner: "Builder",
      due: "Day 7",
      outcome: "Shareable GTM plan artifact",
    },
    {
      title: "Run first founder demo calls",
      owner: "Founder",
      due: "Day 10",
      outcome: "Activation feedback and pricing reactions",
    },
  ];

  return {
    provider,
    generatedAt: new Date().toISOString(),
    summary: `${idea} is positioned as a practical execution layer for ${audience}. The first version should prove that a founder can move from rough concept to a focused launch plan in one sitting.`,
    targetUsers: [
      "Solo founders validating a product before writing too much code",
      "Small teams that need a shared launch plan without hiring a GTM lead",
      "Technical product managers turning ambiguous ideas into execution scope",
    ],
    pains: [
      "Raw ideas are easy to brainstorm but hard to convert into a coherent launch plan.",
      "Founders overbuild because MVP scope, pricing, and acquisition experiments are not linked.",
      "Existing AI tools produce text, not a workspace that tracks next actions and assumptions.",
    ],
    mvpScope: [
      "Guided idea intake with audience, market, and constraint fields",
      "AI-generated GTM workspace with editable sections",
      "Mock provider by default, optional real LLM provider through server-side environment variables",
      "Export-ready plan structure for README, Notion, or investor updates",
    ],
    backlog,
    landingPage: {
      headline: "Turn a raw SaaS idea into a launch-ready workspace",
      subheadline:
        "LaunchLens AI maps your audience, pains, MVP scope, pricing, content plan, and execution tasks from a single founder brief.",
      cta: "Generate workspace",
      proofBullets: [
        "Built for fast validation loops, not generic brainstorming",
        "Keeps launch copy, backlog, and pricing assumptions in one place",
        `Optimized for ${market} under the constraint: ${constraints}`,
      ],
    },
    pricing: {
      hypothesis:
        "Start with a founder-friendly monthly plan, then expand into team workspaces once collaboration and export history exist.",
      tiers: [
        "Free demo: 3 generated workspaces with mock provider",
        "Solo: $19/month for saved workspaces and exports",
        "Team: $59/month for shared boards and evidence tracking",
      ],
      risks: [
        "Users may treat output as generic AI text unless editing and task ownership become strong.",
        "Pricing must be validated against repeated weekly usage, not one-time curiosity.",
      ],
    },
    launchPlan: [
      "Week 1: Ship intake, mock generation, and a polished workspace preview",
      "Week 2: Add persistence, export, provider switching, and first demo scripts",
      "Week 3: Run founder interviews, publish build logs, and refine activation metrics",
      "Week 4: Launch a public demo with example workspaces and waitlist capture",
    ],
    contentCalendar,
    tasks,
    assumptions: [
      "The buyer values speed from idea to action more than perfect market research depth.",
      "The strongest portfolio signal is a usable AI product workflow with clear product judgment.",
      "A mock provider is required so reviewers can run the project without secrets.",
    ],
  };
}
