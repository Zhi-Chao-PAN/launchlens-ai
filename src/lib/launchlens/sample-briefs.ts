import type { LaunchLensInput } from "./types";

export type SampleBrief = {
  id: string;
  label: string;
  input: LaunchLensInput;
};

export const sampleBriefs: SampleBrief[] = [
  {
    id: "activation-analyst",
    label: "B2B SaaS activation",
    input: {
      idea: "An AI activation analyst that turns onboarding support tickets, session notes, and churn reasons into weekly product fixes for small B2B SaaS teams.",
      audience:
        "Seed-stage B2B SaaS founders, product managers, and customer success leads who do not have a dedicated growth analyst.",
      market:
        "Vertical AI workflow tools for SaaS growth, activation, and customer success operations.",
      tone: "Practical, crisp, and founder-friendly",
      constraints:
        "Assume a two-person team, no data warehouse, and a need to show value from uploaded CSVs and copied support notes in the first demo.",
    },
  },
  {
    id: "clinic-admin",
    label: "Clinic admin copilot",
    input: {
      idea: "A clinic admin copilot that drafts patient follow-up messages, summarizes appointment bottlenecks, and creates no-show reduction tasks for small allied health clinics.",
      audience:
        "Clinic owners and practice managers at small physiotherapy, dental, and allied health practices.",
      market:
        "AI operations assistants for healthcare administration with lightweight human approval workflows.",
      tone: "Analytical and investor-ready",
      constraints:
        "Avoid diagnosis or medical advice. Prioritize administrative workflows, privacy, auditability, and human approval before messages are sent.",
    },
  },
  {
    id: "creator-commerce",
    label: "Creator commerce",
    input: {
      idea: "An AI launch planner for creators who want to turn audience comments into micro-products, landing pages, and weekly launch experiments.",
      audience:
        "Newsletter writers, course creators, and creator-operators with small but engaged audiences.",
      market:
        "Creator economy SaaS, audience research automation, and low-code commerce tooling.",
      tone: "Warm and community-led",
      constraints:
        "Assume the user has limited technical skill, needs a first paid experiment within 10 days, and wants copy they can publish immediately.",
    },
  },
];
