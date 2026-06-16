"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronDown } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  DisclosureGroup — provides arrow-key / Home / End navigation across a     */
/*  set of Disclosure buttons. Uses React context so Disclosure children do   */
/*  not need to be direct DOM siblings of the group.                          */
/* -------------------------------------------------------------------------- */

type DisclosureGroupContextValue = {
  register: (id: string, button: HTMLButtonElement) => () => void;
  onKey: (id: string, event: React.KeyboardEvent<HTMLButtonElement>) => void;
};

const DisclosureGroupContext =
  createContext<DisclosureGroupContextValue | null>(null);

type DisclosureGroupProps = {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

/**
 * Wrap a list of <Disclosure> components in <DisclosureGroup> to enable
 * WAI-ARIA accordion-style keyboard navigation: Up/Down moves focus between
 * toggles, Home/End jump to first/last. Individual Disclosures still manage
 * their own open/close state independently (no multi/single collapse lock
 * unless you compose it on top).
 */
export function DisclosureGroup({
  children,
  className = "",
  ...rest
}: DisclosureGroupProps) {
  const itemsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const orderRef = useRef<string[]>([]);

  const register = useCallback(
    (id: string, button: HTMLButtonElement) => {
      itemsRef.current.set(id, button);
      if (!orderRef.current.includes(id)) {
        orderRef.current.push(id);
      }
      return () => {
        itemsRef.current.delete(id);
        orderRef.current = orderRef.current.filter((x) => x !== id);
      };
    },
    [],
  );

  const moveFocus = useCallback(
    (currentId: string, delta: number) => {
      const order = orderRef.current;
      const idx = order.indexOf(currentId);
      if (idx === -1) return;
      const nextIdx = (idx + delta + order.length) % order.length;
      const nextId = order[nextIdx];
      itemsRef.current.get(nextId)?.focus();
    },
    [],
  );

  const jumpTo = useCallback((which: "first" | "last") => {
    const order = orderRef.current;
    if (order.length === 0) return;
    const target =
      which === "first" ? order[0] : order[order.length - 1];
    itemsRef.current.get(target)?.focus();
  }, []);

  const onKey = useCallback(
    (id: string, event: React.KeyboardEvent<HTMLButtonElement>) => {
      const key = event.key;
      if (key === "ArrowDown") {
        event.preventDefault();
        moveFocus(id, 1);
      } else if (key === "ArrowUp") {
        event.preventDefault();
        moveFocus(id, -1);
      } else if (key === "Home") {
        event.preventDefault();
        jumpTo("first");
      } else if (key === "End") {
        event.preventDefault();
        jumpTo("last");
      }
    },
    [moveFocus, jumpTo],
  );

  const ctx = useMemo<DisclosureGroupContextValue>(
    () => ({ register, onKey }),
    [register, onKey],
  );

  return (
    <DisclosureGroupContext.Provider value={ctx}>
      <div className={className} {...rest}>
        {children}
      </div>
    </DisclosureGroupContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*  Disclosure — animated single panel                                        */
/* -------------------------------------------------------------------------- */

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
 * aria-expanded/aria-controls, and the panel uses role="region" with
 * aria-labelledby pointing at the button. When wrapped in a DisclosureGroup,
 * Up/Down/Home/End move focus across sibling disclosures per WAI-ARIA.
 */
export function Disclosure({ title, children, defaultOpen = false }: DisclosureProps) {
  const [open, setOpen] = useState<boolean>(defaultOpen);
  const panelId = useId();
  const buttonId = useId();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const group = useContext(DisclosureGroupContext);

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  // Register with parent group (if any) to enable arrow-key nav.
  useEffect(() => {
    if (!group || !buttonRef.current) return;
    return group.register(buttonId, buttonRef.current);
  }, [group, buttonId]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (group) group.onKey(buttonId, event);
    },
    [group, buttonId],
  );

  return (
    <div className="overflow-hidden rounded-md border border-card bg-card text-sm">
      <h3>
        <button
          id={buttonId}
          ref={buttonRef}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={toggle}
          onKeyDown={handleKeyDown}
          className="group flex w-full items-center justify-between gap-3 rounded px-4 py-3 text-left font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
        >
          <span>{title}</span>
          <ChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 text-muted transition-transform duration-200 ease-out motion-reduce:transition-none group-hover:text-accent"
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
          <div className="px-4 pb-3 pt-1 leading-6 text-foreground/80">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
