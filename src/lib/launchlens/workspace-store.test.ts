import { afterEach, describe, expect, it } from "vitest";

import {
  cloudStorageConfigured,
  hashOwnerToken,
  sharedWorkspaceStatus,
  validateOwnerToken,
  WorkspaceStoreError,
} from "./workspace-store";

const validToken = "a".repeat(43);

describe("workspace store boundaries", () => {
  afterEach(() => {
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
    delete process.env.NEON_DATABASE_URL;
  });

  it("detects configured cloud storage without exposing the connection", () => {
    expect(cloudStorageConfigured()).toBe(false);
    process.env.DATABASE_URL = "postgresql://example.invalid/database";
    expect(cloudStorageConfigured()).toBe(true);
  });

  it("accepts quoted Vercel env-file values", () => {
    process.env["DATABASE_URL"] = ["\"", "example", "\""].join("");
    expect(cloudStorageConfigured()).toBe(true);
  });

  it("accepts high-entropy-shaped owner tokens and hashes them", () => {
    expect(validateOwnerToken(validToken)).toBe(true);
    const hash = hashOwnerToken(validToken);

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain(validToken);
    expect(hashOwnerToken(validToken)).toBe(hash);
  });

  it("rejects malformed owner tokens before database access", () => {
    expect(() => hashOwnerToken("short-token")).toThrowError(
      expect.objectContaining<Partial<WorkspaceStoreError>>({
        code: "invalid_owner_token",
        status: 401,
      }),
    );
  });
});

describe("sharedWorkspaceStatus", () => {
  const NOW = new Date("2026-06-26T12:00:00Z").getTime();

  it("returns not_found when the row is null", () => {
    expect(sharedWorkspaceStatus(null, NOW).status).toBe("not_found");
  });

  it("returns not_found when the row is undefined", () => {
    expect(sharedWorkspaceStatus(undefined, NOW).status).toBe("not_found");
  });

  it("returns revoked when is_public is false", () => {
    expect(
      sharedWorkspaceStatus(
        { is_public: false, share_expires_at: null },
        NOW,
      ).status,
    ).toBe("revoked");
  });

  it("returns ok when is_public is true and share_expires_at is null", () => {
    expect(
      sharedWorkspaceStatus(
        { is_public: true, share_expires_at: null },
        NOW,
      ).status,
    ).toBe("ok");
  });

  it("returns ok when share_expires_at is in the future", () => {
    const future = new Date(NOW + 86_400_000).toISOString();
    expect(
      sharedWorkspaceStatus(
        { is_public: true, share_expires_at: future },
        NOW,
      ).status,
    ).toBe("ok");
  });

  it("returns expired when share_expires_at is exactly now (boundary)", () => {
    const iso = new Date(NOW).toISOString();
    expect(
      sharedWorkspaceStatus(
        { is_public: true, share_expires_at: iso },
        NOW,
      ).status,
    ).toBe("expired");
  });

  it("returns expired when share_expires_at is in the past", () => {
    const past = new Date(NOW - 60_000).toISOString();
    expect(
      sharedWorkspaceStatus(
        { is_public: true, share_expires_at: past },
        NOW,
      ).status,
    ).toBe("expired");
  });

  it("accepts a Date object for share_expires_at", () => {
    const past = new Date(NOW - 60_000);
    expect(
      sharedWorkspaceStatus(
        { is_public: true, share_expires_at: past },
        NOW,
      ).status,
    ).toBe("expired");
  });

  it("accepts a Date object for now", () => {
    const past = new Date(NOW - 60_000).toISOString();
    expect(
      sharedWorkspaceStatus(
        { is_public: true, share_expires_at: past },
        new Date(NOW),
      ).status,
    ).toBe("expired");
  });

  it("returns ok when share_expires_at is a malformed string (defensive)", () => {
    // NaN guard: an unparseable expiry must NOT be treated as expired,
    // otherwise a malformed DB row would silently revoke every share.
    expect(
      sharedWorkspaceStatus(
        { is_public: true, share_expires_at: "not-a-date" },
        NOW,
      ).status,
    ).toBe("ok");
  });

  it("revoked takes precedence over expired when both apply", () => {
    // If the share was turned off (is_public=false), the expiry
    // check is skipped; the row is still revoked.
    const past = new Date(NOW - 60_000).toISOString();
    expect(
      sharedWorkspaceStatus(
        { is_public: false, share_expires_at: past },
        NOW,
      ).status,
    ).toBe("revoked");
  });

  it("returns the distinct 'expired' status (not 'revoked') for past expiries", () => {
    // The page at /share/[id] has separate UI branches for revoked
    // vs expired, so the helper must surface both distinct statuses.
    const past = new Date(NOW - 60_000).toISOString();
    const result = sharedWorkspaceStatus(
      { is_public: true, share_expires_at: past },
      NOW,
    );
    expect(result.status).toBe("expired");
    expect(result.status).not.toBe("revoked");
  });
});
