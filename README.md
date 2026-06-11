# LaunchLens AI

LaunchLens AI is an AI-powered SaaS workspace that turns a raw product idea into a practical go-to-market plan for indie founders, solo builders, and small product teams.

The portfolio goal is to show full-stack AI product judgment: product strategy, UX workflow, provider abstraction, secure environment handling, and a path from mock demo to real LLM-backed SaaS. It is not a pure algorithm or notebook project.

## Product Value

LaunchLens AI helps a founder move from "I have an idea" to a launch workspace with:

- target users and pain points
- MVP scope and feature backlog
- landing page copy
- pricing hypotheses
- launch plan and content calendar
- execution tasks with owners, due dates, and outcomes

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Server route handler for generation
- Mock/demo provider by default
- Optional OpenAI-compatible provider through server-side environment variables

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The app runs without any API key. To try a real provider, copy `.env.example` to `.env.local` and set:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

Do not commit `.env.local` or any secret values.

## AI Design Direction

The first provider layer is intentionally simple:

- `mock` mode returns deterministic demo output so reviewers can run the project immediately.
- `openai` mode is enabled only when `OPENAI_API_KEY` exists on the server.
- provider failures fall back to mock output instead of breaking the product demo.

Next iterations should add saved workspaces, editable sections, export, generation history, prompt/version tracking, and evaluation fixtures.

## Portfolio Positioning

This project is built for Zhi-Chao-PAN's UTS Master of Artificial Intelligence application as a high-quality AI SaaS portfolio artifact. It emphasizes AI full-stack product development and technical product management rather than isolated model research.

See:

- `ROADMAP.md`
- `TASKS.md`
- `PROJECT_MATURITY.md`
- `NIGHTLY_LOG.md`

## Validation

```bash
npm run lint
npm run build
```
