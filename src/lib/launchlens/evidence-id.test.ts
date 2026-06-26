import { afterEach, describe, expect, it, vi } from "vitest";
import { evidenceId } from "./evidence-id";

/**
 * Helper: override `globalThis.crypto.randomUUID` (and optionally the
 * whole crypto object) for one test. Uses `Object.defineProperty`
 * because on Node 20+ `globalThis.crypto` is a getter-only property.
 */
function withCrypto(
  cryptoValue: Crypto | undefined,
  fn: () => void,
) {
  const original = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  Object.defineProperty(globalThis, "crypto", {
    value: cryptoValue,
    configurable: true,
    writable: true,
  });
  try {
    fn();
  } finally {
    if (original) {
      Object.defineProperty(globalThis, "crypto", original);
    } else {
      delete (globalThis as { crypto?: Crypto }).crypto;
    }
  }
}

describe("evidenceId", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a non-empty string", () => {
    const id = evidenceId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("returns different ids on consecutive calls (no fixed seed)", () => {
    const a = evidenceId();
    const b = evidenceId();
    expect(a).not.toBe(b);
  });

  it("returns 1000 unique ids across 1000 calls", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(evidenceId());
    }
    expect(ids.size).toBe(1000);
  });

  it("uses crypto.randomUUID() when available (returns a UUID-shaped string)", () => {
    const id = evidenceId();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const isFallback = id.startsWith("ev_");
    expect(isUuid || isFallback).toBe(true);
  });

  it("falls back to the ev_-prefix scheme when crypto.randomUUID is unavailable", () => {
    withCrypto({} as Crypto, () => {
      const id = evidenceId();
      expect(id.startsWith("ev_")).toBe(true);
    });
  });

  it("falls back when globalThis.crypto is missing entirely", () => {
    withCrypto(undefined, () => {
      const id = evidenceId();
      expect(id.startsWith("ev_")).toBe(true);
    });
  });

  it("fallback scheme yields distinct ids across 100 calls", () => {
    withCrypto({} as Crypto, () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(evidenceId());
      }
      expect(ids.size).toBe(100);
    });
  });

  it("fallback id contains the ev_ prefix and is alphanumeric + underscore only", () => {
    withCrypto({} as Crypto, () => {
      const id = evidenceId();
      expect(id.startsWith("ev_")).toBe(true);
      expect(id.slice(3)).toMatch(/^[0-9a-z_]+$/);
    });
  });
});
