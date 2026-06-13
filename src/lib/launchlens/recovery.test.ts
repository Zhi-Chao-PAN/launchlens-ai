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
