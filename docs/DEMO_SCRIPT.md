# LaunchLens AI Demo Script

This is the public portfolio demo track. It is written for a 6 to 8 minute
walkthrough with enough engineering detail to support a UTS Master of AI or
AI Product Engineer conversation.

## Demo Goal

Show that LaunchLens is not just a prompt box. It is a full product loop:

```text
founder brief -> structured GTM workspace -> validation evidence -> cited AI decision -> cloud recovery/share -> release gates
```

The strongest message is that the AI output is useful, but the system does not
trust it blindly. Human evidence, privacy boundaries, cloud persistence, and
repeatable gates turn the demo into a real software artifact.

## Setup

Use the production URL once the RC is promoted:

```text
https://launchlens-ai-two.vercel.app
```

Use `docs/PORTFOLIO_CASE_STUDY.md` as the written companion for reviewers who
want the problem, architecture, verification, and next-stage tradeoffs before
or after the live walkthrough.

Until production promotion is complete, use a local production build or an
authenticated Vercel preview for private rehearsal. Do not present the protected
preview URL as the public demo.

Before a live demo, run:

```bash
npm run verify:public-demo
```

After production promotion, use the stronger version:

```bash
LAUNCHLENS_EXPECTED_GIT_SHA=$(git rev-parse --short HEAD) npm run verify:public-demo
```

## 6 To 8 Minute Flow

### 1. Open With The Product Problem

Say:

```text
Early founders often jump from idea to features without validating who hurts,
why they would switch, and what evidence should change the roadmap.
LaunchLens turns that messy early-stage reasoning into an editable workspace
and then keeps a validation loop attached to it.
```

Open the app and use the `B2B SaaS activation` sample brief or paste a concise
founder brief.

### 2. Generate The Workspace

Click `Generate workspace`.

Point out:

- The app works without provider secrets because mock mode is deterministic.
- Real MiniMax/OpenAI-compatible providers are server-only opt-ins.
- The generated workspace is structured, editable, and exportable, not a
  one-off chat transcript.

### 3. Walk The Validation Board

Move to the Validation Board.

Show:

- Search and filter.
- A supported, testing, and refuted hypothesis.
- Evidence counts and confidence.
- Timeline/history preview.
- Export menu.

Say:

```text
The important thing here is that assumptions have stable IDs, so evidence does
not silently move to the wrong hypothesis when the generated plan changes.
```

### 4. Show The Decision Copilot

Open or regenerate the AI decision brief.

Point out:

- Claims must cite recorded evidence IDs.
- Decision briefs invalidate when the underlying evidence changes.
- The app separates recommendation, evidence strength, grounded claims,
  unresolved risks, and next actions.

This is the AI-safety/product-judgment part of the demo: the system narrows the
model's freedom instead of hoping a general answer is correct.

### 5. Save, Recover, And Share

If cloud storage is enabled:

1. Save a workspace snapshot.
2. Generate or use a recovery key.
3. Explain that the recovery key is not stored by the app.
4. Enable a 7-day public share link.
5. Open the share page.

Point out the privacy boundary:

- Public share includes status, confidence, decisions, next actions, linked
  tasks, and evidence counts.
- It excludes founder input, evidence notes, sources, owner credentials, and
  private AI decision briefs.

Disable sharing and show that the link is revoked.

### 6. Close With Engineering Evidence

End with the release gates:

```text
This project is designed like a small production product: local release gate,
cloud DB contract verifier, production public-status verifier, cloud smoke,
tenant isolation, RBAC smoke, CI, visual regression, and provider/decision evals.
```

Mention:

- `npm run release:local`
- `npm run release:cloud`
- `docs/RELEASE_CANDIDATE.md`
- `docs/PRODUCTION_RUNBOOK.md`

## Short 90-Second Version

```text
LaunchLens takes a founder brief and creates a structured go-to-market
workspace. The interesting part is what happens after generation: each
assumption becomes a validation experiment, evidence is attached to stable
hypothesis IDs, and the decision copilot can only cite recorded evidence.
The workspace can be saved, recovered through a capability key, shared through
a privacy-safe public projection, and verified with local plus cloud release
gates. So the project demonstrates AI product engineering, not just model API
usage.
```

## Questions To Be Ready For

### Why not normal login?

This portfolio version uses a registration-free capability account because the
demo needs low friction. The server only stores hashes, recovery is explicit,
and the re-entry cost for a commercial identity/billing model is documented in
`PROJECT_MATURITY.md`.

### What prevents the AI from inventing validation evidence?

The provider generates the GTM workspace. Evidence is user-recorded state. The
decision copilot receives bounded evidence and must cite real evidence IDs; the
validator rejects invented IDs and stale evidence fingerprints.

### What makes this more than a CRUD app?

The product has a closed reasoning loop: generation, evidence, decision,
execution task linkage, persistence, sharing, and evaluation. The engineering
work is in the boundaries between those stages.

### What would you build next?

After production promotion, the next phase is a commercial-readiness slice:
pricing/onboarding, stronger team roles, long-term eval retention, and a clearer
tenant/billing model. That phase should start from the documented re-entry cost
rather than adding features blindly.
