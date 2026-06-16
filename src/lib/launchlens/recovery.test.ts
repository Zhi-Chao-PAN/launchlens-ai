import { describe, expect, it } from "vitest";

import { createRecoveryKey, deriveRecoveryOwnerToken } from "./recovery";

describe("recovery capability", () => {
  it("derives the same owner token across browsers and normalized handles", async () => {
    const key = "A".repeat(32);
    const first = await deriveRecoveryOwnerToken(" Founder@Example.com ", key);
    const second = await deriveRecoveryOwnerToken("founder@example.com", key);

    expect(first).toBe(second);
    expect(first).toMatch(/^acct_[A-Za-z0-9_-]{43}$/);
  });

  it("creates high-entropy recovery keys and rejects weak inputs", async () => {
    expect(createRecoveryKey()).toMatch(/^[A-Za-z0-9_-]{32}$/);
    await expect(
      deriveRecoveryOwnerToken("founder@example.com", "short"),
    ).rejects.toThrow("invalid_recovery_input");
    await expect(
      deriveRecoveryOwnerToken("", "A".repeat(32)),
    ).rejects.toThrow("invalid_recovery_input");
  });
});


describe("recovery capability edge cases", () => {
  it("rejects recovery keys with invalid characters (slashes, spaces, unicode)", async () => {
    const badKeys = [
      "abc/defghijklmnopqrstuvwxyz123456",
      "abc defghijklmnopqrstuvwxyz123456",
      "abc+defghijklmnopqrstuvwxyz123456",
      "abc=defghijklmnopqrstuvwxyz123456",
      "短いkey",
    ];
    for (const k of badKeys) {
      await expect(
        deriveRecoveryOwnerToken("founder@example.com", k),
      ).rejects.toThrow("invalid_recovery_input");
    }
  });

  it("rejects labels that exceed RECOVERY_LABEL_MAX_LENGTH after trim", async () => {
    const longLabel = "a".repeat(161);
    await expect(
      deriveRecoveryOwnerToken(longLabel, "A".repeat(32)),
    ).rejects.toThrow("invalid_recovery_input");

    // Exactly 160 chars is fine
    const okLabel = "a".repeat(160);
    const result = await deriveRecoveryOwnerToken(okLabel, "A".repeat(32));
    expect(result).toMatch(/^acct_[A-Za-z0-9_-]{43}$/);
  });

  it("accepts keys at the minimum length boundary (24 chars)", async () => {
    const minKey = "A".repeat(24);
    const result = await deriveRecoveryOwnerToken("a@b.co", minKey);
    expect(result).toMatch(/^acct_[A-Za-z0-9_-]{43}$/);

    // 23 chars -> rejected
    await expect(
      deriveRecoveryOwnerToken("a@b.co", "A".repeat(23)),
    ).rejects.toThrow("invalid_recovery_input");
  });

  it("is case-sensitive in the key but trims and lowercases the label", async () => {
    const key1 = "A".repeat(32);
    const key2 = "a".repeat(32);
    const r1 = await deriveRecoveryOwnerToken("  FOO@bar.COM  ", key1);
    const r2 = await deriveRecoveryOwnerToken("foo@bar.com", key1);
    const r3 = await deriveRecoveryOwnerToken("foo@bar.com", key2);
    expect(r1).toBe(r2);
    expect(r1).not.toBe(r3);
  });

  it("produces URL-safe base64 tokens with no padding or +/", async () => {
    const result = await deriveRecoveryOwnerToken("founder@example.com", "A".repeat(32));
    expect(result).not.toMatch(/[+/=]/);
    expect(result.startsWith("acct_")).toBe(true);
  });
});

describe("createRecoveryKey", () => {
  it("returns a 32-char URL-safe base64url string (24 random bytes = 32 base64url chars)", () => {
    const key = createRecoveryKey();
    expect(typeof key).toBe("string");
    expect(key).toMatch(/^[A-Za-z0-9_-]{32}$/);
  });

  it("produces distinct keys on successive calls", () => {
    const a = createRecoveryKey();
    const b = createRecoveryKey();
    expect(a).not.toBe(b);
  });
});

describe("deriveRecoveryOwnerToken validation", () => {
  it("rejects empty labels", async () => {
    await expect(deriveRecoveryOwnerToken("", "A".repeat(32))).rejects.toThrow(
      "invalid_recovery_input",
    );
  });

  it("rejects labels over 160 chars", async () => {
    await expect(
      deriveRecoveryOwnerToken("a".repeat(161), "A".repeat(32)),
    ).rejects.toThrow("invalid_recovery_input");
  });

  it("rejects keys with invalid characters", async () => {
    await expect(
      deriveRecoveryOwnerToken("a@b.co", "has spaces and!!"),
    ).rejects.toThrow("invalid_recovery_input");
  });

  it("deriveRecoveryOwnerToken returns a consistent token for the same input", async () => {
    const key = createRecoveryKey();
    const t1 = await deriveRecoveryOwnerToken("workspace-label", key);
    const t2 = await deriveRecoveryOwnerToken("workspace-label", key);
    expect(t1).toBe(t2);
    expect(typeof t1).toBe("string");
    expect(t1.length).toBeGreaterThan(10);
  });

  it("different recovery keys produce different owner tokens", async () => {
    const k1 = createRecoveryKey();
    const k2 = createRecoveryKey();
    const t1 = await deriveRecoveryOwnerToken("label", k1);
    const t2 = await deriveRecoveryOwnerToken("label", k2);
    expect(t1).not.toBe(t2);
  });

});
