import { afterEach, describe, expect, it } from "vitest";

import {
  cloudStorageConfigured,
  hashOwnerToken,
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
