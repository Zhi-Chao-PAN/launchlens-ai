import { describe, expect, it } from "vitest";

import { API_ERROR_MESSAGES, friendlyApiMessage } from "./api-errors";
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
});
