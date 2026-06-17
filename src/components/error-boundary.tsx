"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

type ErrorBoundaryProps = {
  children: ReactNode;
  /** Label shown in the fallback UI (e.g. "Validation board"). */
  label: string;
  /** Optional custom fallback component. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Called when an error is caught. */
  onError?: (error: Error, info: ErrorInfo) => void;
};

type ErrorBoundaryState = {
  error: Error | null;
};

/**
 * Local error boundary that catches rendering errors in a subtree and shows a
 * graceful fallback instead of taking down the whole page.
 *
 * Usage:
 *   <ErrorBoundary label="Validation board">
 *     <ValidationBoard ... />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (typeof window !== "undefined") {
      console.error(
        `[LaunchLens] ErrorBoundary (${this.props.label}):`,
        error,
        info,
      );
    }
    this.props.onError?.(error, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      if (this.props.fallback) {
        return this.props.fallback(error, this.reset);
      }
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-md border border-signal-challenges bg-card p-4 text-center"
        >
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-signal-challenges text-signal-challenges">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-foreground">
            {this.props.label} encountered an error
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted">
            This section ran into a problem. Try reloading or continue using
            the rest of the workspace.
          </p>
          {process.env.NODE_ENV !== "production" && error.message ? (
            <pre className="mt-3 overflow-x-auto rounded-md bg-signal-challenges p-2 text-left font-mono text-[11px] text-signal-challenges">
              {error.message}
            </pre>
          ) : null}
          <button
            type="button"
            onClick={this.reset}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md bg-signal-challenges px-3 text-xs font-semibold text-signal-challenges transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-challenges focus-visible:ring-offset-1"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
