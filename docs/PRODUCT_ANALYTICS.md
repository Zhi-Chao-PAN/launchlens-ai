# Product analytics

LaunchLens AI separates traffic measurement from product-funnel measurement:

- `@vercel/analytics` supplies aggregate page views after Web Analytics is
  enabled for the Vercel project.
- `launchlens_product_events` stores server-confirmed product milestones in
  Neon.

## Core funnel

The first production funnel measures distinct anonymous browser journeys:

1. `workspace_generation_started`
2. `workspace_generation_completed`
3. Handoff through `cloud_snapshot_saved` or `public_share_enabled`

Run the aggregate report locally against the configured database:

```bash
npm run analytics:funnel -- 30
```

The argument is a 1–90 day window. The report returns started, completed,
handoff, saved, and shared journey counts plus completion and handoff rates.
Run `npm run db:migrate` before the first report so the event table and indexes
exist.

## Privacy boundary

The event store never receives founder brief text, evidence notes, evidence
sources, provider payloads, decision-brief content, recovery keys, or owner
credentials. The anonymous owner token and optional source/workspace identifier
are SHA-256 digests before insertion. Rows contain only:

- a random event ID;
- hashed journey and subject identifiers;
- an allowlisted event name;
- optional provider and generation mode;
- the server timestamp.

Analytics writes are best effort: database or analytics failures are logged
with connection strings redacted and never fail generation, cloud save, or
sharing.

Vercel Web Analytics must be enabled in the project dashboard before page views
appear. The core product funnel does not depend on Vercel custom events.
