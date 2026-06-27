/**
 * Client-side mapping from API error codes to user-facing messages.
 *
 * Route handlers return { code, error } in their JSON error bodies. When the
 * UI needs to show a toast or inline error, it should prefer `code` over the
 * raw `error` string because codes are stable across language tweaks and give
 * us a single place to adjust tone/wording.
 *
 * Anything unrecognized falls back to a generic "please try again" message.
 */
export const API_ERROR_MESSAGES: Record<string, string> = {
  auth_missing: "Please sign in to continue.",
  auth_invalid: "Your session has expired. Please sign in again.",
  auth_forbidden: "You do not have permission to perform that action.",

  invalid_json: "The request was malformed. Please refresh and try again.",
  body_too_large: "That request was too large to process. Try a shorter brief.",
  invalid_input: "Some fields did not pass validation. Please check and retry.",
  invalid_id: "The requested item could not be found (invalid ID).",
  invalid_tenant_id: "Invalid workspace.",
  invalid_workspace: "The workspace data looks corrupted. Please regenerate.",
  workspace_too_large: "That workspace is too large to save in one request.",

  rate_limited: "You are making requests too quickly. Wait a moment and try again.",
  cloud_rate_limited: "Cloud storage is busy right now. Wait a moment and retry.",

  not_found: "The requested item was not found.",
  workspace_not_found: "That workspace could not be found.",
  tenant_not_found: "That workspace could not be found.",
  already_shared: "This workspace already has a share link.",

  quota_exceeded: "Storage quota exceeded. Delete an older snapshot first.",
  commercial_plan_limit_reached:
    "This action is outside the current plan limit. Remove usage or move to the next plan.",
  usage_meter_unavailable:
    "Live AI usage needs cloud metering before it can run on this deployment.",
  billing_not_configured:
    "Stripe billing is not enabled on this deployment.",
  invalid_billing_plan:
    "Choose the Solo or Team plan before starting checkout.",
  billing_subscription_exists:
    "This account already has a subscription. Use Manage billing to change it.",
  billing_subscription_missing:
    "This account does not have a managed subscription yet.",
  billing_signature_invalid:
    "The billing update could not be verified.",
  billing_return_url_invalid:
    "The billing return address is not configured safely.",
  billing_checkout_failed:
    "Stripe Checkout could not be started. Please retry.",
  billing_request_failed:
    "Billing is temporarily unavailable. Please retry.",
  billing_storage_unavailable:
    "Billing storage is temporarily unavailable. Please retry.",
  billing_tenant_unavailable:
    "The billing account could not be prepared. Please retry.",
  billing_owner_conflict:
    "Both capability accounts have billing records. Manage them before linking recovery.",
  billing_event_conflict:
    "A billing event identifier was reused with different content.",
  invalid_billing_record:
    "The saved billing state could not be read safely. Please contact support.",

  cloud_unavailable: "Cloud storage is not configured on this deployment.",
  cloud_request_failed: "Cloud storage could not be reached. Please retry.",
  db_unavailable: "The database is temporarily unavailable. Please retry.",

  provider_timeout: "The AI provider took too long to respond. Please retry.",
  provider_failed: "The AI provider could not be reached. Please retry.",
  provider_misconfigured: "AI provider is not configured correctly.",
  provider_validation_failed: "The AI response could not be parsed. Please retry.",
  decision_invalid_response: "The AI response was not a valid decision brief. Please retry.",

  invite_invalid: "That invite link is not valid.",
  invite_expired: "That invite link has expired.",
  invite_already_accepted: "That invite has already been accepted.",
  invite_unavailable: "That invite link is not available.",
  invalid_invite_token: "That invite link is not valid.",

  recovery_invalid: "Recovery key is not valid.",
  recovery_key_too_short: "Recovery key is too short.",
  handle_too_short: "The provided handle is too short.",
  invalid_recovery_token: "Recovery token is not valid.",
  invalid_owner_token: "Owner token is not valid.",

  generation_failed: "Workspace generation failed. Please try again.",
  idea_too_short: "Please provide a product idea with at least 12 characters.",
  field_too_long: "One of your inputs exceeds the maximum length.",

  decision_no_evidence:
    "Add at least one evidence note before generating a decision brief.",

  invalid_workspace_id: "That workspace could not be found.",
  workspace_forbidden: "You do not have access to that workspace.",
  invalid_share_state: "Sharing state could not be changed right now.",

  invalid_member_role: "The selected member role is not valid.",

  invalid_tenant_payload: "The workspace details look invalid.",
};

export function friendlyApiMessage(code: string | null | undefined, fallback: string): string {
  if (!code) return fallback;
  return API_ERROR_MESSAGES[code] ?? fallback;
}
