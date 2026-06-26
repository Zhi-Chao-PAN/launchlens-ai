import { describe, expect, it } from "vitest";
import {
  cleanEnvValue,
  pickEnvConnection,
  sanitizedErrorMessage,
} from "./env-clean";

describe("cleanEnvValue", () => {
  it("returns empty string for undefined / null / empty input", () => {
    expect(cleanEnvValue(undefined)).toBe("");
    expect(cleanEnvValue(null)).toBe("");
    expect(cleanEnvValue("")).toBe("");
    expect(cleanEnvValue("   ")).toBe("");
  });

  it("returns the trimmed string when no surrounding quotes", () => {
    expect(cleanEnvValue("  hello  ")).toBe("hello");
    expect(cleanEnvValue("postgres://example/db")).toBe("postgres://example/db");
  });

  it("strips a matched pair of double quotes", () => {
    expect(cleanEnvValue('"hello"')).toBe("hello");
    expect(cleanEnvValue('  "hello"  ')).toBe("hello");
  });

  it("strips a matched pair of single quotes", () => {
    expect(cleanEnvValue("'hello'")).toBe("hello");
  });

  it("leaves mismatched quotes untouched", () => {
    // Mismatched: starts with " but ends with '
    expect(cleanEnvValue('"hello\'')).toBe('"hello\'');
    // Single char with quotes
    expect(cleanEnvValue('"')).toBe('"');
  });

  it("leaves a value that starts with a quote but no closing quote untouched", () => {
    expect(cleanEnvValue('"hello')).toBe('"hello');
  });

  it("preserves a single inner quote if the outer pair doesn't match", () => {
    // Two chars starting/ending with quote, but middle is the same char
    expect(cleanEnvValue('""')).toBe("");
    expect(cleanEnvValue("''")).toBe("");
  });
});

describe("pickEnvConnection", () => {
  it("returns the first non-empty value", () => {
    process.env.URL_A = "first";
    process.env.URL_B = "second";
    expect(pickEnvConnection(["URL_A", "URL_B"])).toBe("first");
    delete process.env.URL_A;
    expect(pickEnvConnection(["URL_A", "URL_B"])).toBe("second");
    delete process.env.URL_B;
  });

  it("returns empty when neither env var is set", () => {
    expect(pickEnvConnection(["URL_X", "URL_Y"])).toBe("");
  });

  it("strips surrounding quotes from the resolved value", () => {
    process.env.URL_Q = '"postgresql://example/db"';
    expect(pickEnvConnection(["URL_Q"])).toBe("postgresql://example/db");
    delete process.env.URL_Q;
  });
});

describe("sanitizedErrorMessage", () => {
  it("returns the error message when it's an Error instance", () => {
    const err = new Error("boom");
    expect(sanitizedErrorMessage(err, [])).toBe("boom");
  });

  it("returns a fallback message for non-Error input", () => {
    expect(sanitizedErrorMessage("oops", [])).toBe(
      "LaunchLens cloud database migration failed.",
    );
    expect(sanitizedErrorMessage({ code: 1 }, [])).toBe(
      "LaunchLens cloud database migration failed.",
    );
    expect(sanitizedErrorMessage(null, [])).toBe(
      "LaunchLens cloud database migration failed.",
    );
  });

  it("redacts blocked env values >= 12 chars from the message", () => {
    process.env.DATABASE_URL = "postgresql://user:secret@host.example/db";
    const err = new Error("connect failed at postgresql://user:secret@host.example/db");
    const out = sanitizedErrorMessage(err, ["DATABASE_URL"]);
    expect(out).toContain("[redacted]");
    expect(out).not.toContain("user:secret");
    expect(out).toContain("connect failed at");
    delete process.env.DATABASE_URL;
  });

  it("does NOT redact values shorter than 12 chars (avoids false-positive over-redaction)", () => {
    process.env.DATABASE_URL = "short";
    const err = new Error("connection 'short' failed");
    const out = sanitizedErrorMessage(err, ["DATABASE_URL"]);
    // 'short' is 5 chars < 12, so it is NOT in the blockedValues list.
    expect(out).toContain("short");
    delete process.env.DATABASE_URL;
  });

  it("redacts multiple blocked values when both appear in the message", () => {
    process.env.DATABASE_MIGRATION_URL = "postgresql://migration-secret@host/db";
    process.env.DATABASE_URL = "postgresql://user-secret@host/db";
    const err = new Error("connect failed at postgresql://migration-secret@host/db AND postgresql://user-secret@host/db");
    const out = sanitizedErrorMessage(err);
    expect(out).not.toContain("migration-secret");
    expect(out).not.toContain("user-secret");
    expect(out).toContain("[redacted]");
    delete process.env.DATABASE_MIGRATION_URL;
    delete process.env.DATABASE_URL;
  });

  it("returns the original message when no blocked values are set", () => {
    const err = new Error("plain error");
    expect(sanitizedErrorMessage(err, [])).toBe("plain error");
  });
});