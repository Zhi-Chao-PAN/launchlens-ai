name: Bug report
about: Something reproducible is wrong with the product, the API, the CI, or the docs.
title: "[bug] "
labels: ["bug"]
assignees: []
---

## Summary

One or two sentences describing the bug.

## Steps to reproduce

1.
2.
3.

## Expected

What should have happened.

## Actual

What actually happened.

## Environment

- Commit SHA: `git rev-parse HEAD`
- Node: `node --version`
- OS: `winver` / `sw_vers` / `cat /etc/os-release`
- Branch: `git branch --show-current`
- Local vs deployed: `npm run dev` / Vercel preview URL
- With or without `DATABASE_URL`: yes / no
- With or without `MINIMAX_API_KEY`: yes / no
- With or without `OPENAI_API_KEY`: yes / no

## Verification already tried

- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- `npm run build`

## Logs or screenshots

Paste application logs (fixed event codes only, no owner token), or attach screenshots.

## Notes

Anything else worth knowing (browser, viewport, account age, related issues).
