import { describe, it, expect, beforeAll } from "vitest";
import { webcrypto } from "node:crypto";
import {
  ENCRYPTED_FILE_PREFIX,
  decryptToJson,
  defaultCryptoProvider,
  encryptJson,
  fromB64,
  isEncryptedPayload,
  randomPassword,
  type CryptoProvider,
} from "./encrypt-export";

/**
 * Node's built-in webcrypto exposes the same shape (getRandomValues, subtle)
 * as the browser's window.crypto. We cast it to our local type because the
 * Web Crypto types are structurally compatible.
 */
const nodeProvider: CryptoProvider = {
  // Tests only ever pass a Uint8Array, so we cast to a known-good signature.
  getRandomValues: ((arr: ArrayBufferView) => webcrypto.getRandomValues(arr as Uint8Array)) as unknown as CryptoProvider["getRandomValues"],
  subtle: webcrypto.subtle as unknown as CryptoProvider["subtle"],
};

describe("encrypt-export: round-trip", () => {
  beforeAll(() => {
    // Sanity: globalThis.crypto may exist in newer node; our helper should
    // detect it. We still pass `nodeProvider` explicitly to keep tests
    // self-contained.
    expect(typeof nodeProvider.subtle.encrypt).toBe("function");
  });

  it("encrypts and decrypts a small string", async () => {
    const plaintext = "hello launchlens";
    const payload = await encryptJson(plaintext, "correct-horse-battery", nodeProvider);
    expect(payload.startsWith(ENCRYPTED_FILE_PREFIX)).toBe(true);
    const decrypted = await decryptToJson(payload, "correct-horse-battery", nodeProvider);
    expect(decrypted).toBe(plaintext);
  });

  it("preserves unicode and newlines", async () => {
    const plaintext = "Line 1\nLine 2\n中文 🚀 \u2603";
    const payload = await encryptJson(plaintext, "pw", nodeProvider);
    const decrypted = await decryptToJson(payload, "pw", nodeProvider);
    expect(decrypted).toBe(plaintext);
  });

  it("produces a different ciphertext each time (random salt + iv)", async () => {
    const plaintext = "same input";
    const a = await encryptJson(plaintext, "same-pw", nodeProvider);
    const b = await encryptJson(plaintext, "same-pw", nodeProvider);
    expect(a).not.toBe(b);
  });

  it("rejects with a wrong password", async () => {
    const payload = await encryptJson("secret", "right", nodeProvider);
    await expect(decryptToJson(payload, "wrong", nodeProvider)).rejects.toThrow();
  });

  it("rejects malformed payload missing prefix", async () => {
    await expect(decryptToJson("not-encrypted", "pw", nodeProvider)).rejects.toThrow(
      "Not an encrypted payload",
    );
  });

  it("rejects malformed payload with prefix but wrong segment count", async () => {
    const bad = ENCRYPTED_FILE_PREFIX + "only.two";
    await expect(decryptToJson(bad, "pw", nodeProvider)).rejects.toThrow(
      "Malformed encrypted payload",
    );
  });

  it("rejects payload whose cipher section was tampered with", async () => {
    const payload = await encryptJson("secret", "pw", nodeProvider);
    const parts = payload.slice(ENCRYPTED_FILE_PREFIX.length).split(".");
    parts[2] = parts[2].slice(0, -2) + "AA"; // corrupt ciphertext
    const tampered = ENCRYPTED_FILE_PREFIX + parts.join(".");
    await expect(decryptToJson(tampered, "pw", nodeProvider)).rejects.toThrow();
  });
});

describe("encrypt-export: payload format", () => {
  it("isEncryptedPayload detects the prefix", () => {
    expect(isEncryptedPayload(ENCRYPTED_FILE_PREFIX + "x.y.z")).toBe(true);
  });
  it("isEncryptedPayload returns false for plain JSON", () => {
    expect(isEncryptedPayload('{"hello":"world"}')).toBe(false);
  });
  it("isEncryptedPayload returns false for empty/non-string", () => {
    expect(isEncryptedPayload("")).toBe(false);
    expect(isEncryptedPayload(null as unknown as string)).toBe(false);
    expect(isEncryptedPayload(undefined as unknown as string)).toBe(false);
  });
  it("fromB64 round-trips through toB64 (URL-safe alphabet)", () => {
    const original = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    let bin = "";
    for (const byte of original) bin += String.fromCharCode(byte);
    const b64 = Buffer.from(bin, "binary").toString("base64").replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
    const round = fromB64(b64);
    expect(Array.from(round)).toEqual(Array.from(original));
  });
});

describe("encrypt-export: randomPassword", () => {
  it("returns a string of expected length", () => {
    expect(randomPassword(nodeProvider, 12).length).toBe(12);
  });
  it("only contains the safe alphabet (no ambiguous chars)", () => {
    const alphabet = new Set("ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789");
    const pwd = randomPassword(nodeProvider, 64);
    for (const c of pwd) expect(alphabet.has(c)).toBe(true);
  });
  it("uses no easily-confused characters (0, O, 1, I, l)", () => {
    for (let i = 0; i < 10; i++) {
      const pwd = randomPassword(nodeProvider, 64);
      expect(pwd).not.toMatch(/[0OIl1]/);
    }
  });
  it("produces different passwords across calls (high entropy)", () => {
    const a = randomPassword(nodeProvider, 16);
    const b = randomPassword(nodeProvider, 16);
    const c = randomPassword(nodeProvider, 16);
    expect(new Set([a, b, c]).size).toBe(3);
  });
});

describe("encrypt-export: crypto provider detection", () => {
  it("defaultCryptoProvider returns a provider when globalThis.crypto is available", () => {
    // In node 20+ globalThis.crypto exists.
    const c = (globalThis as { crypto?: unknown }).crypto;
    if (c) {
      expect(defaultCryptoProvider()).not.toBeNull();
    } else {
      // Older node without globalThis.crypto — the helper returns null and
      // helpers that need crypto throw.
      expect(defaultCryptoProvider()).toBeNull();
    }
  });
});
