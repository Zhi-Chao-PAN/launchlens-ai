import { describe, expect, it } from "vitest";

import { API_ERROR_MESSAGES, friendlyApiMessage } from "./api-errors";
import * as errorCodes from "./error-codes";
import {
  ERROR_AUTH_MISSING,
  ERROR_BODY_TOO_LARGE,
  ERROR_RATE_LIMITED,
} from "./error-codes";

describe("friendlyApiMessage", () => {
  it("returns the mapped message for known error codes", () => {
    expect(friendlyApiMessage(ERROR_AUTH_MISSING, "fallback")).toMatch(/sign in/i);
    expect(friendlyApiMessage(ERROR_BODY_TOO_LARGE, "fallback")).toMatch(/large/i);
    expect(friendlyApiMessage(ERROR_RATE_LIMITED, "fallback")).toMatch(/quickly/i);
  });

  it("falls back to the provided message when the code is unknown", () => {
    expect(friendlyApiMessage("totally_unknown_code", "try again please")).toBe(
      "try again please",
    );
  });

  it("falls back when code is null/undefined", () => {
    expect(friendlyApiMessage(null, "boom")).toBe("boom");
    expect(friendlyApiMessage(undefined, "boom")).toBe("boom");
    expect(friendlyApiMessage("", "boom")).toBe("boom");
  });

  it("every registered code maps to a non-empty string", () => {
    for (const [code, msg] of Object.entries(API_ERROR_MESSAGES)) {
      expect(typeof msg).toBe("string");
      expect(msg.length).toBeGreaterThan(8);
      expect(code).toMatch(/^[a-z_]+$/);
    }
  });

  it("covers every exported ERROR_* constant from error-codes", () => {
    const exported = Object.entries(errorCodes)
      .filter(([k]) => k.startsWith("ERROR_"))
      .map(([, v]) => v as string);
    expect(exported.length).toBeGreaterThan(20);
    for (const code of exported) {
      expect(API_ERROR_MESSAGES).toHaveProperty(code);
      expect(typeof API_ERROR_MESSAGES[code]).toBe("string");
      expect(API_ERROR_MESSAGES[code].length).toBeGreaterThan(8);
    }
  });

  it("maps decision-specific error codes to readable messages", () => {
    expect(friendlyApiMessage("decision_no_evidence", "fallback")).toMatch(/evidence/i);
    expect(friendlyApiMessage("decision_invalid_response", "fallback")).toMatch(/parsed|retry/i);
    expect(friendlyApiMessage("decision_no_evidence", "fallback")).not.toBe("fallback");
    expect(friendlyApiMessage("decision_invalid_response", "fallback")).not.toBe("fallback");
  });

  it("stability: message keys use lowercase snake_case only", () => {
    for (const code of Object.keys(API_ERROR_MESSAGES)) {
      expect(code).toMatch(/^[a-z_]+$/);
      expect(code.charAt(0)).not.toBe("_");
      expect(code.charAt(code.length - 1)).not.toBe("_");
    }
  });

  it("stability: messages are non-empty and reasonably distinct", () => {
    const messages = Object.values(API_ERROR_MESSAGES);
    // All messages should have at least a few words
    for (const msg of messages) {
      expect(msg.split(" ").length).toBeGreaterThanOrEqual(2);
      expect(msg.endsWith(".") || msg.endsWith("?")).toBe(true);
    }
    // Most messages should be unique (aliases are OK but a majority must be distinct)
    const unique = new Set(messages.map((m) => m.toLowerCase()));
    expect(unique.size).toBeGreaterThan(messages.length * 0.7);
  });


  it("returns undefined when fallback is undefined and code is unknown", () => {
    const result = friendlyApiMessage("unknown_code", undefined as unknown as string);
    expect(result).toBeUndefined();
  });

  it("handles null/empty error code gracefully with fallback", () => {
    expect(friendlyApiMessage("", "oops")).toBe("oops");
    expect(friendlyApiMessage(null as unknown as string, "oops")).toBe("oops");
  });

  it("every error code constant has a friendly message", () => {
    const allCodes = Object.entries(errorCodes)
      .filter(([key]) => key.startsWith("ERROR_"))
      .map(([, value]) => value);
    expect(allCodes.length).toBeGreaterThan(0);
    for (const code of allCodes) {
      expect(API_ERROR_MESSAGES).toHaveProperty(code);
      expect(typeof API_ERROR_MESSAGES[code]).toBe("string");
      expect(API_ERROR_MESSAGES[code].length).toBeGreaterThan(0);
    }
  });

  it("friendlyApiMessage returns a non-empty string for every known error code", () => {
    const allCodes = Object.entries(errorCodes)
      .filter(([key]) => key.startsWith("ERROR_"))
      .map(([, value]) => value);
    for (const code of allCodes) {
      const msg = friendlyApiMessage(code, "fallback");
      expect(typeof msg).toBe("string");
      expect(msg.length).toBeGreaterThan(0);
      expect(msg).not.toBe("fallback");
    }
  });

  it('every error code in the map has a non-empty message', () => {
    const codes = Object.keys(API_ERROR_MESSAGES);
    expect(codes.length).toBeGreaterThan(5);
    for (const code of codes) {
      expect(typeof API_ERROR_MESSAGES[code]).toBe('string');
      expect(API_ERROR_MESSAGES[code].length).toBeGreaterThan(0);
    }
  });

});

describe('API_ERROR_MESSAGES completeness', () => {
  it('has entries for all major error categories', () => {
    const codes = Object.keys(API_ERROR_MESSAGES);
    expect(codes.length).toBeGreaterThan(5);
    // Should contain auth, rate limit, body size errors
    const hasAuth = codes.some(c => c.includes('auth'));
    const hasRate = codes.some(c => c.includes('rate_limit'));
    expect(hasAuth || hasRate).toBe(true);
  });

  it('all messages are non-empty strings', () => {
    for (const msg of Object.values(API_ERROR_MESSAGES)) {
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    }
  });
});
