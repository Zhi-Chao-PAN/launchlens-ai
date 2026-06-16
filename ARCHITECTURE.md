# Architecture

LaunchLens AI is a Next.js 16 App Router application written in TypeScript with
Tailwind CSS v4. It ships two interfaces that share the same domain logic: an
interactive editor at `/` and a read-only shared view at `/share/[id]`.

## Request flow

```
Browser ──▶ Next.js route (src/app/**/route.ts)
               │
               ├── zod-style validation  (src/lib/launchlens/workspace-validation.ts)
               ├── rate limiting         (per-route, in-memory window)
               ├── owner/session checks  (ownerTokenFromRequest / allowWorkspaceMutation)
               │
               └──▶ Provider / Store
                       │
                       ├── provider-runtime.ts  ◀── OpenAI-compatible / MiniMax HTTP
                       │     └── AbortSignal.timeout + ProviderError codes
                       │
                       ├── workspace-store.ts   ◀── Neon serverless (optional)
                       │     └── share / recovery / tenant helpers
                       │
                       └── decision-provider.ts ◀── structured JSON decision brief
```

When a database is not configured, cloud routes return `cloud_unavailable` and
the UI degrades gracefully to local editing + Markdown / JSON export.

## Domain model

All workspace data flows through the `LaunchLensWorkspace` type in
`src/lib/launchlens/types.ts`. The execution state (experiments, evidence,
decisions) lives in `WorkspaceExecutionState` (`src/lib/launchlens/execution.ts`)
and is kept separate from the snapshot-able workspace so that evidence and
decisions do not blow up share-link payloads.

Key files:
- `provider.ts` / `provider-runtime.ts` / `mock-provider.ts` — model abstraction.
- `workspace-quality.ts` — deterministic 0-100 quality score for generated output.
- `decision-eval.ts` / `decision-history.ts` — eval harness and regression data.
- `markdown-export.ts` / `json-export.ts` — serializers, both covered by unit tests.
- `error-codes.ts` + `api-errors.ts` — stable code constants + UI-friendly messages.
- `overlays.ts` — Escape coordination between toasts, modals, and popovers.
- `clipboard.ts` — `copyTextToClipboard` / `downloadTextFile` browser helpers.

## UI shell

- `src/app/layout.tsx` mounts `ToastProvider` and `SkipLink`.
- `src/components/launch-workspace.tsx` is the main editor screen; it wires the
  brief sidebar, generation progress, workspace sections, export toolbar, cloud
  panel, and validation board.
- `src/components/shared-workspace-view.tsx` renders the read-only snapshot; it
  does no network I/O beyond what the server provides.
- `src/components/toast.tsx` is a custom toast provider with per-id timers,
  pause-on-hover, Shift+Esc dismiss-all, and a visibilitychange fix so
  background-tab setTimeout throttling cannot drift timers.
- `src/hooks/use-focus-trap.ts` is a small Tab/Shift+Tab trap used by the
  shortcuts modal and onboarding wizard.
- `src/hooks/use-keyboard-shortcuts.ts` is the global shortcut registry; the
  shortcuts modal renders whatever is registered.

## State and persistence

- **Local state:** React `useState` inside `launch-workspace.tsx`. Browser-local
  persistence is via `localStorage` for the current brief and generated
  workspace.
- **Cloud state (optional):** Neon Postgres through `@neondatabase/serverless`.
  The owner token is a random URL-safe string stored in localStorage; possession
  grants write/delete permission. Share links are public-by-id read-only views.
- **Recovery:** A deterministically derived recovery key (PBKDF2-style) lets an
  owner re-link a new device to an existing cloud account.
- **Sessions:** NextAuth is wired at `/api/auth/[...nextauth]` for future OAuth
  expansion; the demo does not require sign-in.

## Testing

- `npx vitest run` executes the unit suite under a `node` environment (no jsdom).
  Only pure-logic modules are unit-tested; components are exercised via
  Playwright e2e (`npm run test:e2e`).
- `npm run smoke:e2e` runs just the happy-path spec against the auto-started dev
  server.
- `scripts/visual-regression.ts` produces deterministic snapshots for diffing.
- Every push to `main` runs GitHub Actions for lint, typecheck, unit tests,
  build, and CodeQL.
