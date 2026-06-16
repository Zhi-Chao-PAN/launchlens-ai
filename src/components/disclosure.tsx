"use client";

import { useCallback, useId, useState } from "react";
import { ChevronDown } from "lucide-react";

interface DisclosureProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

/**
 * Smooth-animating disclosure used by the pricing FAQ and other static
 * FAQ-style sections. Uses the grid-rows 0fr -> 1fr trick so content height
 * does not need to be measured; collapsed content is marked inert so it
 * cannot receive focus or be read by screen readers until expanded.
 *
 * Accessibility: the toggle is a real <button>, the region exposes
 * aria-expanded/aria-controls, and the panel uses role="region" with an
 * aria-labelledby pointing at the button so screen readers can jump between
 * question and answer.
 */
export function Disclosure({ title, children, defaultOpen = false }: DisclosureProps) {
  const [open, setOpen] = useState<boolean>(defaultOpen);
  const panelId = useId();
  const buttonId = useId();

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Let native button activation handle Enter/Space already; nothing to do.
      if (event.key === "Home") {
        event.preventDefault();
        (event.currentTarget as HTMLElement).focus();
        // Home/End could move focus across a disclosure group in a future
        // enhancement, but for isolated FAQ items we just stay put.
      }
    },
    [],
  );

  return (
    <div className="overflow-hidden rounded-md border border-[#d8ded4] bg-white text-sm">
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={toggle}
          onKeyDown={handleKeyDown}
          className="group flex w-full items-center justify-between gap-3 rounded px-4 py-3 text-left font-semibold text-[#17201d] transition-colors hover:bg-[#f6f8f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-1"
        >
          <span>{title}</span>
          <ChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 text-[#607069] transition-transform duration-200 ease-out motion-reduce:transition-none group-hover:text-[#138a72]"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        inert={!open}
        className="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="px-4 pb-3 pt-1 leading-6 text-[#40504a]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
