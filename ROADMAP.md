# LaunchLens AI Roadmap

## North Star

LaunchLens AI should become a credible AI SaaS portfolio project that shows product thinking, full-stack engineering, and practical AI workflow design. The product turns a raw SaaS idea into an actionable go-to-market workspace.

## Phase 1: Foundation and Demo Flow

- Scaffold Next.js, TypeScript, Tailwind, and lint/build tooling.
- Create a demo-first workspace interface rather than a blank landing page.
- Add a mock provider so the app works without secrets.
- Add an optional OpenAI-compatible provider behind server-side environment variables.
- Add an optional MiniMax Token Plan provider behind server-side environment variables.
- Add editable generated sections and Markdown export.
- Add tests for mock mode, fallback behavior, and API validation.
- Document the roadmap, tasks, maturity status, and nightly handoff log.

## Phase 2: Portfolio-Ready Product Loop

- Add persistent saved workspaces.
- Add persistence for edited workspaces.
- Add export to JSON.
- Track assumptions and validation evidence.
- Add stable example workspaces for realistic reviewer demos.
- Add tests for provider fallback and API validation.
- Add loading/progress UX for long real-provider calls.
- Add provider quality fixtures/evals for MiniMax and OpenAI-compatible outputs.

## Phase 3: SaaS Shape

- Add authentication and user-owned workspace history.
- Add pricing and usage limits.
- Add team collaboration primitives.
- Add prompt versioning, eval fixtures, and generation quality checks.
- Deploy a public demo with a polished README and screenshots.

## Product Principles

- Start with a complete founder workflow, not a generic chatbot.
- Always run without secrets through the mock provider.
- Treat AI output as editable product infrastructure.
- Return safe fallback codes instead of exposing provider error details.
- Keep portfolio evidence visible in code, docs, and demo UX.
- Prefer clear product judgment over algorithm theater.
