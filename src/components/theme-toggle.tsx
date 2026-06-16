"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    // SSR placeholder - same size to avoid layout shift
    return (
      <button
        type="button"
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-[#cfd8d1] bg-white text-[#40504a] opacity-0 sm:h-8 sm:w-8"
        tabIndex={-1}
      >
        <Sun className="size-4" aria-hidden="true" />
      </button>
    );
  }

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const label =
    theme === "dark"
      ? "Dark mode (click to cycle)"
      : theme === "light"
      ? "Light mode (click to cycle)"
      : "System theme (click to cycle)";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-[#cfd8d1] bg-white text-[#40504a] transition hover:border-[#138a72] hover:text-[#138a72] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-1 print:hidden sm:h-8 sm:w-8"
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
