# A first LaunchLens trial

Audience hypothesis: an independent builder with a prototype, deciding what to investigate or change in the next release. This is a hypothesis to test, not a claim of product-market fit.

## Participant entry

Share `/trial` on the exact preview or production deployment that contains this change. The guide is bilingual and opens the workspace in another tab so feedback notes remain visible. Start with a sample. When a real provider is enabled, submitted brief text can reach that provider. Keep confidential plans, customer data and credentials out of the trial.

A first session should take roughly 15 minutes:

1. Understand the sample brief and identify the displayed execution mode.
2. Inspect one assumption and add or evaluate one source.
3. Choose one next action, explaining what evidence supports it.
4. Export a backup. If cloud save is tested, verify success separately and keep recovery information private.
5. Complete the feedback form, review the text, and download it. Nothing is automatically sent to the maintainer. The notes live only in that tab until exported; refreshing clears them.

If download is unavailable, the prepared text remains selectable. The public GitHub issue link is for redacted bugs; private trial notes should go through the inviter's chosen channel. The feedback export does not automatically read workspace content, tokens, browser diagnostics or URLs. Users must still review their own free-text answers for sensitive details.

## Invitation draft

> I'm testing a small tool for turning research and user evidence into a next release decision. Would you try one task for about 15 minutes, using sample or non-sensitive data? I'm especially interested in where the process is unclear and whether you would return for another decision. There is no need to give a positive review. Here is the trial guide: [the exact tested deployment]/trial. Please send your reviewed feedback file back through this conversation; don't include private plans or keys.

> 我在测试一个把研究和用户证据整理成下一次发布决策的小工具。想请你用示例或不敏感的数据试一个任务，约 15 分钟。我主要想了解哪里不清楚、哪里卡住，以及下次是否还会用，不需要给好评。入口是：[实际验收过的部署地址]/trial。检查反馈文件后通过当前沟通渠道发给我即可，请不要附上保密计划或密钥。

These are drafts, not invitations that have been sent.

## Observer record

Ask permission before observing or recording. Note the version tested, task, displayed mode, steps completed without assistance, intervention required, blockers, evidence the user accepted or rejected, actual next action and whether a second session occurred. Keep participant records privately; do not commit them to this repository. Do not infer retention from page views or a working analytics endpoint.

After several trials, review the same task and recurring friction before expanding scope. Five initial participants and a follow-up within two weeks are planning checkpoints, not statistical proof of demand.

## Technical gate

`npm run quality` checks lint, unit tests, types, eval fixtures, build and dependency audit. The Browser trial workflow builds the current commit and runs the browser suite locally on every PR with real-provider execution disabled and database URLs empty. It no longer depends on an optional live URL being configured.

For local reproduction after `npm run build`:

```sh
npx playwright install chromium
PLAYWRIGHT_PRODUCTION=1 npm run test:e2e -- --retries=0
```

Set `PLAYWRIGHT_BROWSERS_PATH` if browsers are stored outside the default cache. The managed local test server disables live generation and cloud database URLs. Use an isolated environment without production `.env` files; any externally supplied `PLAYWRIGHT_BASE_URL`/`PLAYWRIGHT_NO_WEBSERVER` is your responsibility. This browser run verifies behavior with mock generation, not real-model answer quality, cloud persistence, billing, hosted recovery or user demand.

Before sharing a hosted preview, verify `/trial`, sample input, displayed provider mode, export and the exact feedback download on that preview. If it requires authentication, arrange access explicitly; a successful deployment check does not prove anonymous access. Only include real-provider or cloud features in a trial after verifying their configuration and behavior separately.
