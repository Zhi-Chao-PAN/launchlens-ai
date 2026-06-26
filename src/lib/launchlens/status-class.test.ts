import { describe, expect, it } from "vitest";
import { statusClass } from "./status-class";

describe("statusClass", () => {
  it("returns signal-supports classes for 'supported'", () => {
    expect(statusClass("supported")).toBe(
      "bg-signal-supports text-signal-supports",
    );
  });
  it("returns signal-challenges classes for 'refuted'", () => {
    expect(statusClass("refuted")).toBe(
      "bg-signal-challenges text-signal-challenges",
    );
  });
  it("returns signal-neutral classes for 'testing'", () => {
    expect(statusClass("testing")).toBe(
      "bg-signal-neutral text-signal-neutral",
    );
  });
  it("returns muted classes for 'untested'", () => {
    expect(statusClass("untested")).toBe("bg-muted text-muted");
  });
  it("returns muted classes for any unknown / future status (forward-compat)", () => {
    // Future status additions should fall into the muted branch
    // rather than throw.
    expect(() => statusClass("abandoned" as never)).not.toThrow();
    expect(statusClass("abandoned" as never)).toBe("bg-muted text-muted");
  });
  it("returns non-empty classes for every known status", () => {
    for (const s of ["supported", "refuted", "testing", "untested"] as const) {
      expect(statusClass(s).length).toBeGreaterThan(0);
    }
  });
});
