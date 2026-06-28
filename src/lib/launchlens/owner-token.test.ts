import { describe, expect, it } from "vitest";
import {
  createOwnerToken,
  getOrCreateOwnerToken,
  LEGACY_OWNER_TOKEN_STORAGE_KEY,
  OWNER_TOKEN_STORAGE_KEY,
} from "./owner-token";

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

// Minimal in-memory Storage stub for the getOrCreateOwnerToken tests below.
function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
    removeItem: (k: string) => {
      data.delete(k);
    },
    clear: () => data.clear(),
  };
}

describe("getOrCreateOwnerToken", () => {
  it("uses one canonical key across product surfaces", () => {
    const stored = createOwnerToken(fixed(6));
    const storage = memoryStorage({ [OWNER_TOKEN_STORAGE_KEY]: stored });

    expect(getOrCreateOwnerToken(storage)).toBe(stored);
  });

  it("migrates the former generation-only key when the canonical key is absent", () => {
    const legacy = createOwnerToken(fixed(5));
    const storage = memoryStorage({
      [LEGACY_OWNER_TOKEN_STORAGE_KEY]: legacy,
    });

    expect(getOrCreateOwnerToken(storage)).toBe(legacy);
    expect(storage.getItem(OWNER_TOKEN_STORAGE_KEY)).toBe(legacy);
  });

  it("returns the existing token when storage holds a valid one", () => {
    const stored = createOwnerToken(fixed(7));
    const storage = memoryStorage({ "launchlens.ownerToken": stored });
    expect(getOrCreateOwnerToken(storage, "launchlens.ownerToken")).toBe(stored);
  });

  it("mints a fresh token and persists it when storage is empty", () => {
    const storage = memoryStorage();
    const token = getOrCreateOwnerToken(storage, "launchlens.ownerToken");
    expect(token).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
    // Persisted under the same key so subsequent calls reuse it.
    expect(storage.getItem("launchlens.ownerToken")).toBe(token);
  });

  it("replaces a malformed stored value with a freshly minted one", () => {
    const storage = memoryStorage({ "launchlens.ownerToken": "not-a-valid-token" });
    const token = getOrCreateOwnerToken(storage, "launchlens.ownerToken");
    expect(token).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
    expect(token).not.toBe("not-a-valid-token");
    expect(storage.getItem("launchlens.ownerToken")).toBe(token);
  });

  it("does not throw when storage is null (e.g. SSR / sandboxed context)", () => {
    // The primary failure mode this guards against: launch-workspace.tsx
    // mounts on the server briefly during SSR, and some browsers throw on
    // any localStorage access in private mode. Both should yield a token
    // without bubbling an exception to the caller.
    expect(() => getOrCreateOwnerToken(null, "launchlens.ownerToken")).not.toThrow();
    const token = getOrCreateOwnerToken(null, "launchlens.ownerToken");
    expect(token).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
  });
});
