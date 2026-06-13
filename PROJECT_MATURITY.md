# Project Maturity

Status: early-stage
Completion estimate: 93%

LaunchLens AI is currently in an early SaaS product stage. It has a real product direction, a public Vercel demo, stable evidence-backed examples, an editable workspace interface, an assumption-to-decision validation loop, an evidence-grounded AI decision copilot, browser-local persistence, Neon-backed owner-scoped cloud snapshot history, privacy-safe read-only sharing, Markdown/JSON export, tests, and provider abstraction that supports no-key mock mode plus optional real providers.

It is not portfolio-ready yet.

## Current Strengths

- The project is a practical AI SaaS workflow, not a pure theory or algorithm artifact.
- It can run without secrets through a mock provider.
- The first screen shows a product workflow: founder brief to generated GTM workspace to editing and Markdown export.
- Stable example fixtures give reviewers repeatable demo outputs before screenshots or deployment exist.
- Markdown and JSON export support both human-readable review and machine-readable automation handoff.
- Assumptions and pricing risks are visible, making AI product judgment easier to review.
- Assumptions now become interactive experiments with evidence signals, confidence, decisions, next actions, and stable links to execution tasks.
- The evidence-grounded AI decision copilot adds a third connected AI workflow stage after generation and validation.
- Decision briefs cite exact evidence IDs, track source fingerprints, and are invalidated when evidence changes.
- Decision-brief generation defaults to deterministic mock mode and uses real providers only with explicit live opt-in.
- Decision briefs now have a repeatable mock CI eval and a persisted MiniMax live fixture across supported, neutral, and challenged evidence cases.
- Claim stance is normalized from cited evidence signals, so recommendation labels and citations cannot drift apart.
- Private Markdown/JSON exports include decision briefs while public shares keep briefs and raw evidence private.
- Validation progress is measured separately from generated-workspace quality, avoiding a misleading single AI score.
- Stable examples demonstrate supported, testing, and refuted hypotheses instead of presenting only empty controls.
- The current brief and generated workspace are saved in browser-local storage and restored after refresh.
- MiniMax and OpenAI-compatible provider hooks are optional and guarded by env-based configuration.
- MiniMax provider behavior has unit coverage, a successful app-route smoke, and a persisted three-scenario live regression fixture.
- Provider parsing now handles fenced JSON, reasoning tags, minor JSON repair, and safe fallback.
- Generation progress and safe provider metadata are visible without exposing secrets.
- Deterministic workspace quality checks now score generated outputs for structural completeness.
- Documentation now gives nightly automation a clear continuation path.
- The repository now includes an MIT license.
- GitHub Actions CI now runs lint, tests, build, and moderate audit on pushes and pull requests.
- A fresh clone was verified without API keys using `npm ci`, tests, build, audit, page smoke, and mock `/api/generate`.
- A public Vercel deployment is linked from README and keeps the no-key mock experience available.
- README now includes desktop and mobile product screenshots.
- Production-mode browser QA covers desktop and 390px mobile layouts, editing, local restore, mock generation, and horizontal overflow.
- Generated timestamps use deterministic UTC formatting so server and browser output hydrate consistently.
- Provider evals are explicit, prompt-versioned, secret-scanned, scenario-aware, and mock-only in standard CI.
- The persisted MiniMax fixture covers activation SaaS, clinic administration, and creator commerce with real-provider output, no fallback, 100% structural quality, and passed scenario constraints.
- A lazy Neon data layer now supports owner-scoped snapshot creation, listing, restore, deletion, and explicit read-only sharing without breaking no-database builds.
- Vercel Marketplace Neon is provisioned, migrated, and covered by a repeatable cloud smoke for save, restore, share, disable-share, delete, execution state, and decision-brief privacy.
- Anonymous owner tokens are generated in the browser and stored only as SHA-256 hashes server-side; API routes add nested schema validation, UUID checks, limits, safe errors, and mutation throttling.
- Request byte limits now run before JSON parsing; accepted snapshots are normalized to known fields with bounded strings, arrays, and timestamps.
- Anonymous snapshot creation uses transaction advisory locks and conditional insertion to enforce atomic per-owner and global capacity gates.
- Runtime database access is server-only and DML-only by design; schema DDL lives in an explicit migration command.
- Public share reads use a dedicated projection that does not select or type the private founder brief.
- Public execution projections expose only decision state and evidence counts; evidence notes and sources remain private.
- Public projections also exclude private AI decision briefs.
- Legacy snapshots without execution state receive deterministic default experiments, while private execution state round-trips through local/cloud persistence and exports.
- The product now renders deliberate local-only, checking, empty-history, busy, success, and cloud-failure states.
- Cloud persistence has focused route and ownership tests, while local-only production rendering has browser evidence.
- A diff-scoped security review covered all changed/new source files; two request-body candidates were fixed and no reportable finding survived validation.
- A second diff-scoped review covered all 18 Phase 3B source changes and found no technically plausible security candidate.

## Current Gaps

- Cloud ownership is an anonymous browser-token beta, not recoverable account authentication.
- Mutation throttling is process-local; distributed abuse control and hosting-log header verification remain production activation gates.
- Provider eval history is currently one snapshot; trend comparison and release thresholds are not automated yet.
- UX still needs deeper empty/error-state polish and deployed visual regression coverage.
- Production Neon has not yet proven the new execution state through a real cloud round trip.
- Production Neon has not yet proven decision briefs through a real cloud save/restore round trip.
- Decision-brief eval history has an initial fixture, but historical trend comparison and latency thresholds are not automated yet.

## Portfolio Criteria Evidence

1. Product depth: strong partial pass. The app connects raw idea, audience/pain mapping, MVP scope, backlog, pricing, launch calendar, assumptions, evidence, AI decision briefs, founder decisions, and linked tasks.
2. Agent/LLM depth: strong partial pass. It has provider orchestration, complete-schema validation, mock mode, real-provider env support, safe errors, parser repair, progress UI, safe metadata, prompt-versioned evals, deterministic quality scoring, scenario compliance checks, persisted MiniMax regression evidence, evidence-grounded decision synthesis with per-claim citations, and a dedicated decision-quality eval gate.
3. Full-stack quality: strong partial pass. Next.js, TypeScript, Tailwind, tests, editable UI, stable evidence fixtures, local persistence, a Neon-backed snapshot API, owner-scoped history/share UI, private/public execution projections, Markdown/JSON export, responsive QA, cloud smoke verification, and screenshots exist; account auth and distributed abuse controls are pending.
4. Verification: partial pass. `lint`, `test`, and `build` pass; production-mode Playwright QA now covers desktop/mobile rendering and the core no-key workflow.
5. Documentation: partial pass. README covers value prop, setup, env vars, demo flow, screenshots, architecture, AI design, roadmap, and portfolio story.
6. GitHub presentation: partial pass. Public repo, public Vercel demo, desktop/mobile screenshots, useful topics, clear commits, MIT license, and CI quality gate exist.
7. Portfolio story: partial pass. README explains AI full-stack Solopreneur/TPM positioning for the UTS Master of AI application and now includes public product and model-eval evidence; the story should become tighter with server persistence and final case-study metrics.
8. Maturity: partial pass. Multiple meaningful iterations now exist, but it remains a 1-2 week marathon project rather than finished portfolio work.
9. Quality review: not yet complete. A final quality pass must still cover UX, accessibility, mobile, docs, secret hygiene, build/test status, and story before completion.

## 1-2 Week Portfolio-Ready Acceptance Checklist

- [x] Fresh clone runs with `npm ci`, `npm run dev`, and no API key.
- [x] `npm run lint`, `npm run test`, and `npm run build` pass in documented local verification.
- [x] Mock provider and real-provider fallback have tests.
- [x] User can edit key generated sections.
- [x] User can export a workspace to Markdown and JSON.
- [x] User can restore the current workspace from browser-local storage after refresh.
- [x] Generation progress and safe provider metadata are visible.
- [x] Deterministic workspace quality scoring is included.
- [x] At least two realistic sample workspaces are included.
- [x] Stable example workspace fixtures are included for repeatable reviewer demos.
- [x] One MiniMax live app-route smoke succeeded without fallback using repo-external secrets.
- [x] Three public MiniMax scenarios have persisted, secret-scanned, no-fallback regression fixtures.
- [x] README includes screenshots.
- [x] README includes architecture diagram and product demo script.
- [x] Public deployment URL is linked from README.
- [x] Repository includes a license.
- [x] Repository includes a CI quality gate.
- [x] Desktop and 390px mobile layouts pass production-mode browser QA without horizontal overflow or hydration errors.
- [x] Cloud workspace APIs are build-safe without a database and expose an explicit local-only capability state.
- [x] Anonymous owner-scoped snapshot history and opt-in read-only sharing are implemented with focused tests.
- [x] Cloud request streams, nested content, owner quotas, public projections, and migration privileges have security-focused controls and regression evidence.
- [x] Assumptions can collect evidence, confidence, decisions, next actions, and stable task links.
- [x] Validation state survives local restore and is included in private Markdown/JSON handoff.
- [x] Public sharing excludes evidence notes/sources and communicates the privacy boundary.
- [x] AI decision briefs cite recorded evidence only, invalidate stale evidence, and remain private in public shares.
- [x] The decision-copilot UI passes desktop and 390px mobile production-mode browser QA.
- [x] Decision-copilot evals run in no-secret CI and have a secret-scanned MiniMax live fixture.
- [x] Production Neon save, restore, share, disable-share, and delete pass end-to-end smoke verification.
- [ ] Distributed abuse protection and owner-header log hygiene are verified on the production host.
- [ ] Recoverable user authentication replaces anonymous browser ownership.
- [x] The app clearly communicates AI product thinking, full-stack skill, and TPM-style prioritization.
- [x] No secrets, private tokens, or generated local environment files are committed.

## Maturity Notes

The next cycles should move from anonymous ownership to recoverable authentication in Phase 3C, then add distributed abuse protection and hosting-log header hygiene checks. Deployed visual regression coverage and historical provider/decision eval comparison remain useful follow-ups. The project now demonstrates an AI plan-to-learning-to-decision workflow with real cloud persistence rather than a text generator, but it should not be called portfolio-ready until auth, abuse controls, and the final quality audit are complete.
