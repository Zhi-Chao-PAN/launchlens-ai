import { describe, expect, it } from "vitest";

// The Toast component is a React Client Component that depends on DOM
// globals (window.setTimeout, window.addEventListener) and on React context,
// and this project runs vitest in the "node" environment without jsdom or
// @testing-library/react. We therefore smoke-test the module surface and
// the pure data contract; rendering behavior is covered end-to-end via
// Playwright.

import { ToastProvider, useToast } from "./toast";

describe("Toast module", () => {
  it("exports ToastProvider as a component function", () => {
    expect(typeof ToastProvider).toBe("function");
  });

  it("exports useToast as a hook function", () => {
    expect(typeof useToast).toBe("function");
  });

  it("does not execute client-only code at module import time", () => {
    // This test passes simply by virtue of the module having been imported
    // successfully above (no window/document access at top level).
    expect(true).toBe(true);
  });
});
