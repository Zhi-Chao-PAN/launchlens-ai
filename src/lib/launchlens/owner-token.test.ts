import { describe, expect, it } from "vitest";
import { createOwnerToken } from "./owner-token";

// Deterministic random: returns the same byte value for every position
function fixed(value: number) {
  return (_arr: Uint8Array) => {
    return _arr.map(() => value);
  };
}

describe("createOwnerToken", () => {
  it("returns a string of length 43 (32 bytes -> base64 ceil)", () => {
    // 32 bytes -> ceil(32/3)*4 = 44 chars minus 1 for the trailing '='
    // (since 32 mod 3 = 2). After the URL-safe base64 alpha (no padding)
    // the result is 43 chars.
    expect(createOwnerToken(fixed(0)).length).toBe(43);
  });

  it("uses only URL-safe base64 alphabet (A-Z a-z 0-9 - _)", () => {
    const token = createOwnerToken(fixed(255));
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("returns a different value when the random source changes", () => {
    const a = createOwnerToken(fixed(0));
    const b = createOwnerToken(fixed(1));
    expect(a).not.toBe(b);
  });

  it("returns the same value for the same random source (deterministic)", () => {
    const a = createOwnerToken(fixed(42));
    const b = createOwnerToken(fixed(42));
    expect(a).toBe(b);
  });

  it("does not contain + / = (URL-safe variant)", () => {
    // Try a range of bytes to find one that would produce a '+' or '/' or '='
    // in base64. Our alpha map should be safe for ALL 256 byte values:
    // 32 bytes of the same value never produce '+' or '/' in the base64
    // output for any single-byte value.
    for (let v = 0; v < 256; v++) {
      const token = createOwnerToken(fixed(v));
      expect(token).not.toMatch(/[+/=]/);
    }
  });
});
