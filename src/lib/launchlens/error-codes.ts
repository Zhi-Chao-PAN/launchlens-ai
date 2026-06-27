// Standardized error codes for LaunchLens API
//
// Naming convention: {domain}_{specific_reason}
// HTTP status mapping is documented alongside each code.
//
// Use these constants instead of string literals so all routes
// produce consistent error codes that clients can rely on.

// --- Authentication & authorization ---
export const ERROR_AUTH_MISSING = "auth_missing";
export const ERROR_AUTH_INVALID = "auth_invalid";
export const ERROR_AUTH_FORBIDDEN = "auth_forbidden";

// --- Request validation ---
export const ERROR_INVALID_JSON = "invalid_json";
export const ERROR_BODY_TOO_LARGE = "body_too_large";
export const ERROR_INVALID_INPUT = "invalid_input";
export const ERROR_INVALID_ID = "invalid_id";
export const ERROR_INVALID_TENANT_ID = "invalid_tenant_id";
export const ERROR_INVALID_WORKSPACE = "invalid_workspace";
export const ERROR_WORKSPACE_TOO_LARGE = "workspace_too_large";

// --- Rate limiting ---
export const ERROR_RATE_LIMITED = "rate_limited";
export const ERROR_CLOUD_RATE_LIMITED = "cloud_rate_limited";

// --- Resource state ---
export const ERROR_NOT_FOUND = "not_found";
export const ERROR_WORKSPACE_NOT_FOUND = "workspace_not_found";
export const ERROR_TENANT_NOT_FOUND = "tenant_not_found";
export const ERROR_ALREADY_SHARED = "already_shared";

// --- Quota ---
export const ERROR_QUOTA_EXCEEDED = "quota_exceeded";
export const ERROR_COMMERCIAL_PLAN_LIMIT = "commercial_plan_limit_reached";

// --- Cloud / infrastructure ---
export const ERROR_CLOUD_UNAVAILABLE = "cloud_unavailable";
export const ERROR_CLOUD_REQUEST_FAILED = "cloud_request_failed";
export const ERROR_DB_UNAVAILABLE = "db_unavailable";

// --- Invites ---
export const ERROR_INVITE_INVALID = "invite_invalid";
export const ERROR_INVITE_EXPIRED = "invite_expired";
export const ERROR_INVITE_ALREADY_ACCEPTED = "invite_already_accepted";

// --- Recovery ---
export const ERROR_RECOVERY_INVALID = "recovery_invalid";
export const ERROR_RECOVERY_KEY_TOO_SHORT = "recovery_key_too_short";
export const ERROR_HANDLE_TOO_SHORT = "handle_too_short";

// --- Generation ---
export const ERROR_GENERATION_FAILED = "generation_failed";
export const ERROR_IDEA_TOO_SHORT = "idea_too_short";
export const ERROR_FIELD_TOO_LONG = "field_too_long";

// --- Decision ---
export const ERROR_DECISION_NO_EVIDENCE = "decision_no_evidence";

// --- Workspace ---
export const ERROR_INVALID_WORKSPACE_ID = "invalid_workspace_id";
export const ERROR_WORKSPACE_FORBIDDEN = "workspace_forbidden";

// --- Sharing ---
export const ERROR_INVALID_SHARE_STATE = "invalid_share_state";

// --- Members / RBAC ---
export const ERROR_INVALID_MEMBER_ROLE = "invalid_member_role";

// --- Invites ---
export const ERROR_INVALID_INVITE_TOKEN = "invalid_invite_token";
export const ERROR_INVITE_UNAVAILABLE = "invite_unavailable";

// --- Recovery ---
export const ERROR_INVALID_RECOVERY_TOKEN = "invalid_recovery_token";
export const ERROR_INVALID_OWNER_TOKEN = "invalid_owner_token";

// --- Tenants ---
export const ERROR_INVALID_TENANT_PAYLOAD = "invalid_tenant_payload";
