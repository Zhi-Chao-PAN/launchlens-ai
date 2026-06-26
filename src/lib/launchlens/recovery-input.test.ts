import { describe, expect, it } from "vitest";
import {
  RECOVERY_HANDLE_MAX,
  RECOVERY_KEY_MAX,
  RECOVERY_KEY_MIN,
  validateRecoveryInput,
} from "./recovery-input";

const VALID_KEY = "abcd1234efgh5678ijkl9012mn"; // 24 chars

describe("validateRecoveryInput", () => {
  describe("label validation", () => {
    it("flags an empty label", () => {
      const result = validateRecoveryInput({ label: "", key: VALID_KEY });
      expect(result.labelError).toMatch(/handle/i);
      expect(result.ready).toBe(false);
    });

    it("flags a whitespace-only label", () => {
      const result = validateRecoveryInput({ label: "   \t  ", key: VALID_KEY });
      expect(result.labelError).toMatch(/handle/i);
      expect(result.trimmedLabel).toBe("");
      expect(result.ready).toBe(false);
    });

    it("accepts a normal label", () => {
      const result = validateRecoveryInput({ label: "alex", key: VALID_KEY });
      expect(result.labelError).toBe("");
      expect(result.trimmedLabel).toBe("alex");
    });

    it("trims surrounding whitespace from the label", () => {
      const result = validateRecoveryInput({ label: "  alex  ", key: VALID_KEY });
      expect(result.trimmedLabel).toBe("alex");
    });

    it("flags a label longer than 160 chars", () => {
      const result = validateRecoveryInput({
        label: "x".repeat(RECOVERY_HANDLE_MAX + 1),
        key: VALID_KEY,
      });
      expect(result.labelError).toMatch(/too long/i);
      expect(result.ready).toBe(false);
    });

    it("accepts a label at exactly 160 chars", () => {
      const result = validateRecoveryInput({
        label: "x".repeat(RECOVERY_HANDLE_MAX),
        key: VALID_KEY,
      });
      expect(result.labelError).toBe("");
    });
  });

  describe("key validation", () => {
    it("flags an empty key", () => {
      const result = validateRecoveryInput({ label: "alex", key: "" });
      expect(result.keyError).toMatch(/key/i);
      expect(result.ready).toBe(false);
    });

    it("flags a whitespace-only key", () => {
      const result = validateRecoveryInput({ label: "alex", key: "    " });
      expect(result.keyError).toMatch(/key/i);
      expect(result.trimmedKey).toBe("");
    });

    it("flags a key shorter than 24 chars", () => {
      const result = validateRecoveryInput({
        label: "alex",
        key: "x".repeat(RECOVERY_KEY_MIN - 1),
      });
      expect(result.keyError).toMatch(/valid LaunchLens/i);
    });

    it("flags a key longer than 128 chars", () => {
      const result = validateRecoveryInput({
        label: "alex",
        key: "x".repeat(RECOVERY_KEY_MAX + 1),
      });
      expect(result.keyError).toMatch(/valid LaunchLens/i);
    });

    it("accepts a key at exactly the min length", () => {
      const result = validateRecoveryInput({
        label: "alex",
        key: "a".repeat(RECOVERY_KEY_MIN),
      });
      expect(result.keyError).toBe("");
    });

    it("accepts a key at exactly the max length", () => {
      const result = validateRecoveryInput({
        label: "alex",
        key: "a".repeat(RECOVERY_KEY_MAX),
      });
      expect(result.keyError).toBe("");
    });

    it("rejects keys with disallowed characters", () => {
      // Space, dot, slash — all outside [A-Za-z0-9_-].
      for (const bad of ["x y".padEnd(24, "z"), "x.y".padEnd(24, "z"), "x/y".padEnd(24, "z")]) {
        const result = validateRecoveryInput({ label: "alex", key: bad });
        expect(result.keyError).toMatch(/valid LaunchLens/i);
      }
    });

    it("accepts keys with dashes and underscores", () => {
      const result = validateRecoveryInput({
        label: "alex",
        key: "abcd_1234-efgh_5678-ijkl-90",
      });
      expect(result.keyError).toBe("");
    });

    it("trims surrounding whitespace from the key", () => {
      const result = validateRecoveryInput({
        label: "alex",
        key: "  " + VALID_KEY + "  ",
      });
      expect(result.trimmedKey).toBe(VALID_KEY);
      expect(result.keyError).toBe("");
    });
  });

  describe("ready flag", () => {
    it("is false when label is invalid", () => {
      const result = validateRecoveryInput({ label: "", key: VALID_KEY });
      expect(result.ready).toBe(false);
    });

    it("is false when key is invalid", () => {
      const result = validateRecoveryInput({ label: "alex", key: "short" });
      expect(result.ready).toBe(false);
    });

    it("is false when both are invalid", () => {
      const result = validateRecoveryInput({ label: "", key: "" });
      expect(result.ready).toBe(false);
    });

    it("is true when both are valid", () => {
      const result = validateRecoveryInput({ label: "alex", key: VALID_KEY });
      expect(result.ready).toBe(true);
      expect(result.labelError).toBe("");
      expect(result.keyError).toBe("");
    });
  });

  describe("constants", () => {
    it("RECOVERY_HANDLE_MAX is 160", () => {
      expect(RECOVERY_HANDLE_MAX).toBe(160);
    });

    it("RECOVERY_KEY_MIN is 24", () => {
      expect(RECOVERY_KEY_MIN).toBe(24);
    });

    it("RECOVERY_KEY_MAX is 128", () => {
      expect(RECOVERY_KEY_MAX).toBe(128);
    });
  });
});
