# LaunchLens API Reference

## Base URL

All API routes are relative to the application root. On the hosted demo, this is `https://launchlens-ai-two.vercel.app`.

## Common Headers

| Header | Description |
|--------|-------------|
| `x-launchlens-owner` | Owner token for authenticated workspace operations. Returned by the recovery endpoint. |
| `Content-Type` | `application/json` for POST/PATCH bodies. |
| `x-request-id` | Unique request identifier, returned in all responses for debugging. |
| `x-response-time` | Server-side processing time in milliseconds, returned in all responses. |
| `Cache-Control` | All API responses include `no-store` to prevent caching of workspace data. |

## Error Responses

All error responses follow a consistent shape:

```json
{
  "code": "error_code_snake_case",
  "error": "Human-readable error message"
}
```

Error codes are stable — rely on `code` for programmatic handling, not the message text.

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `invalid_json` | 400 | Request body is not valid JSON. |
| `body_too_large` | 413 | Request body exceeds the size limit for this endpoint. |
| `invalid_input` | 400 | Input validation failed. |
| `rate_limited` | 429 | Too many requests. Retry after the rate limit window. |
| `cloud_rate_limited` | 429 | Cloud workspace mutation rate limit exceeded. |
| `cloud_unavailable` | 503 | Cloud storage is not configured or temporarily unavailable. |
| `cloud_request_failed` | 503 | Cloud storage operation failed. |
| `not_found` | 404 | The requested resource does not exist. |
| `workspace_not_found` | 404 | Workspace not found or caller is not a member. |
| `workspace_forbidden` | 403 | Insufficient role for this operation. |
| `invalid_workspace_id` | 400 | Workspace ID is not a valid UUID. |
| `invalid_tenant_id` | 400 | Tenant ID is not a valid UUID. |
| `tenant_not_found` | 404 | Tenant not found. |
| `invalid_recovery_token` | 400 | Recovery token format is invalid. |
| `invalid_invite_token` | 400 | Invite token format is invalid. |
| `invite_unavailable` | 410 | Invite is expired, already used, or unknown. |

---

## Generation

### POST /api/generate

Generate a full go-to-market workspace from a founder brief.

**Request body:**

```json
{
  "idea": "Product idea description",
  "audience": "Target audience",
  "market": "Market category",
  "tone": "Brand tone",
  "constraints": "Constraints and context"
}
```

**Response (200 OK):** `GenerationResult` — includes the full workspace, provider used, and whether a fallback was triggered.

**Rate limit:** 12 requests / minute per IP.

**Error codes:** `invalid_json`, `body_too_large` (10KB), `idea_too_short`, `field_too_long`, `rate_limited`, `generation_failed`

---

## Decision Briefs

### POST /api/decision

Generate an evidence-grounded decision brief from experiment data.

**Request body:** Experiment source data (evidence items, assumptions).

**Response (200 OK):** Decision brief with conclusion, confidence, rationale, and cited evidence.

**Rate limit:** 16 requests / minute per IP.

**Error codes:** `invalid_json`, `body_too_large` (40KB), `decision_no_evidence`, `rate_limited`

---

## Status

### GET /api/status

Service health and configuration status.

**Response (200 OK):**

```json
{
  "status": "ok",
  "version": "0.1.0",
  "provider": "mock",
  "providerConfigured": false,
  "dbConfigured": false,
  "dbHealthy": false,
  "dbLatencyMs": null,
  "uptimeSec": 1234,
  "vercelEnv": "development",
  "gitSha": "abc1234",
  "responseTimeMs": 5
}
```

**Notes:**
- `dbHealthy` and `dbLatencyMs` are only populated when `dbConfigured` is true.
- Deep database health checks add a few ms of latency to each status call.

---

## Workspaces

### GET /api/workspaces

List all workspaces the caller is a member of.

**Headers:** `x-launchlens-owner` (optional — returns local-only mode if omitted)

**Response (200 OK):** `{ configured: boolean, workspaces: CloudWorkspaceSummary[] }`

### POST /api/workspaces

Create a new cloud workspace.

**Headers:** `x-launchlens-owner` (required)

**Rate limit:** 20 mutations / minute per IP (distributed via Neon).

**Error codes:** `invalid_workspace`, `workspace_too_large`, `cloud_unavailable`, `cloud_rate_limited`

### GET /api/workspaces/[id]

Get a single workspace by ID (member-scoped).

### DELETE /api/workspaces/[id]

Delete a workspace (owner only).

---

## Sharing

### GET /api/workspaces/[id]/share

Get current sharing state.

### POST /api/workspaces/[id]/share

Set sharing state (public/private). Editor or owner role required.

**Body:** `{ isPublic: boolean }`

---

## Members

### GET /api/workspaces/[id]/members

List workspace members.

### POST /api/workspaces/[id]/members

Invite a new member by token. Owner only.

**Body:** `{ inviteToken: string, role: "editor" | "viewer" }`

---

## Invites

### POST /api/workspaces/invites/accept

Accept a workspace invite.

**Body:** `{ inviteToken: string, ownerToken: string }`

---

## Recovery

### POST /api/workspaces/recovery

Recover workspaces using a recovery key. Migrates ownership to a new recovery key.

**Body:** `{ handle: string, recoveryKey: string }`

---

## Tenants

### GET /api/tenants

List all tenants for the current owner.

### POST /api/tenants

Create a new tenant.

### GET /api/tenants/[id]

Get a tenant by ID.

### GET /api/tenants/[id]/workspaces

List workspaces within a tenant.

### POST /api/tenants/[id]/workspaces

Create a workspace inside a specific tenant.

---

## Authentication

NextAuth-based session authentication with recovery-key credentials.
See `/auth/signin` for the sign-in page.

### Routes
- `GET /api/auth/[...nextauth]` — NextAuth endpoints
- `GET /auth/signin` — Sign-in page

---

## Response Format Notes

- All API responses include `x-request-id` and `x-response-time` headers.
- Error responses always include `{ code, error }` shape.
- Workspace data is owner-scoped — callers can only access resources they own or are members of.
- The API works in two modes: local-only (no database) and cloud-backed (Neon Postgres).
  Local mode returns mock/empty data for cloud operations with a `200 OK + configured: false` pattern.
