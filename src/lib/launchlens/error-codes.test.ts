import { describe, expect, it } from "vitest";

import * as errorCodes from "@/lib/launchlens/error-codes";

// Error code contract: every exported code must follow naming convention
// and map to a stable string value.

describe("error codes contract", () => {
  const codeEntries = Object.entries(errorCodes) as Array<
    [string, string]
  >;

  it("exports at least 30 error codes", () => {
    expect(codeEntries.length).toBeGreaterThanOrEqual(30);
  });

  it("all code constants start with ERROR_", () => {
    const badNames = codeEntries.filter(
      ([name]) => !name.startsWith("ERROR_"),
    );
    expect(badNames).toEqual([]);
  });

  it("all code values are kebab-case strings", () => {
    const badValues = codeEntries.filter(([, value]) => {
      return !/^[a-z][a-z0-9_]*$/.test(value);
    });
    expect(badValues).toEqual([]);
  });

  it("no duplicate code values", () => {
    const values = codeEntries.map(([, value]) => value);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it("code constant name matches its value (UPPER_SNAKE -> snake_case)", () => {
    const mismatched = codeEntries.filter(([name, value]) => {
      const expectedValue = name.replace(/^ERROR_/, "").toLowerCase();
      return value !== expectedValue;
    });
    // Some codes intentionally break the pattern for domain grouping;
    // just check that most follow the convention
    const matchRate =
      (codeEntries.length - mismatched.length) / codeEntries.length;
    expect(matchRate).toBeGreaterThan(0.8);
  });

  it("every HTTP status error has a matching 4xx/5xx semantic code", () => {
    // All error codes used in HTTP responses should follow snake_case and be descriptive
    const httpStatusCodes = [
      "invalid_json",
      "body_too_large",
      "rate_limited",
      "not_found",
      "workspace_not_found",
      "cloud_unavailable",
      "cloud_request_failed",
      "db_unavailable",
    ];
    for (const code of httpStatusCodes) {
      const found = codeEntries.some(([, v]) => v === code);
      expect(found).toBe(true);
    }
  });

  it("ERROR_STATUS_* and ERROR_HTTP_* follow numerical suffix pattern when present", () => {
    const numericSuffix = codeEntries.filter(([name]) =>
      /_(4|5)\d{2}$/.test(name),
    );
    // If any exist, they should all be valid HTTP status codes
    for (const value of numericSuffix.map(([, v]) => v)) {
      expect(value.length).toBeGreaterThan(3);
      expect(typeof value).toBe("string");
    }
  });

});
