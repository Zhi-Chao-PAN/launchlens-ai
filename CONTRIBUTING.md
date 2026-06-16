# Contributing

Thanks for stopping by. LaunchLens AI is a portfolio-grade AI SaaS demo that
keeps getting better. Small, well-tested improvements are very welcome.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in MiniMax/OpenAI keys if you want live generation
npm run dev                  # http://localhost:3000
```

Required versions:
- Node 20+
- npm 10+

## Quality gates

Every change must pass four gates before it is merged:

```bash
npx eslint src/ e2e/ --max-warnings=0
npx tsc --noEmit
npx vitest run
npm run build
```

CI runs the same four gates on every push to `main`. If one fails, fix it
in place rather than suppressing warnings.

## Layout

- `src/app/` — Next.js App Router pages and API routes.
- `src/components/` — UI components. Client components are marked
  `"use client"` at the top of the file.
- `src/lib/launchlens/` — Domain logic: generation, validation, workspace
  store, decision copilot, markdown/json export, keyboard shortcuts,
  provider abstractions.
- `src/hooks/` — React hooks including `useFocusTrap`, `useToast`,
  `useKeyboardShortcuts`.
- `e2e/` — Playwright specs. Run against a dev server on port 3099
  (`npm run test:e2e`).
- `scripts/` — One-off TypeScript scripts invoked via `tsx`
  (tenant smoke tests, eval runs, visual regression).

## Conventions

- Tailwind CSS v4 with the LaunchLens brand tokens:
  background `#f6f8f4`, text `#17201d`, primary green `#138a72` / hover
  `#0f7665`, accent orange `#d85b3f`, yellow `#f6df8f`, borders
  `#d8ded4`/`#cfd8d1`, mint ring `#cbe8df`.
- Focus rings: green primary buttons use `ring-[#cbe8df]`; outline/white
  buttons use `ring-[#138a72]`.
- Error surfaces: background `#fff6f1`, border `#e7c9bd`, text `#8b3d28`,
  ring `#f2d4c8`.
- Always add `motion-reduce:` guards for new transitions/animations.
- Never put literal apostrophes inside single-quoted `git commit -m '...'`
  messages on Windows; use em-dash `—` or rephrase.
- Import icons from `lucide-react` in alphabetical order within their block.
- API routes return `{ code, error }` on failure; add any new codes to
  `src/lib/launchlens/error-codes.ts` and a matching friendly message in
  `src/lib/launchlens/api-errors.ts`.

## Adding a shortcut

Register it in `src/hooks/use-keyboard-shortcuts.ts` and call
`registerShortcut(id, handler)` from a component. The shortcuts modal
auto-discovers it via `getShortcutList()`.

## Adding an overlay

Call `pushOverlay()` in a `useEffect` and invoke the returned dispose on
cleanup. Escape is routed to the topmost overlay via the `launchlens:escape`
custom event. The returned handles are idempotent so StrictMode
double-invoke is safe.

## Submitting a PR

- Keep PRs focused: one behavior per pull request.
- Add or update Vitest coverage for non-trivial logic.
- Include a short clip/screenshot if the change is visual.
- Update `CHANGELOG.md` under the `[Unreleased]` section.
