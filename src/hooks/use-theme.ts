"use client";

import { useCallback, useEffect, useState } from "react";

import { nextTheme } from "@/lib/launchlens/theme-cycle";
import type { Theme } from "@/lib/launchlens/theme-cycle";

export type { Theme };

const THEME_KEY = "launchlens:theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const resolved = theme === "system" ? getSystemTheme() : theme;
  root.setAttribute("data-theme", resolved);
  root.style.colorScheme = resolved;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount and listen for system changes
  useEffect(() => {
    // Defer state updates to next tick to avoid cascading renders from mount
    window.setTimeout(() => {
      setMounted(true);
      try {
        const stored = localStorage.getItem(THEME_KEY) as Theme | null;
        if (stored === "light" || stored === "dark" || stored === "system") {
          setTheme(stored);
        }
      } catch {
        // ignore storage errors
      }
    }, 0);

    // Listen for system theme changes when using system mode
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      setTheme((current) => {
        if (current === "system") {
          applyTheme("system");
        }
        return current;
      });
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => nextTheme(current));
  }, []);

  const resolvedTheme = mounted
    ? theme === "system"
      ? getSystemTheme()
      : theme
    : "light";

  return { theme, setTheme, toggleTheme, resolvedTheme, mounted };
}
