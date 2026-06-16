"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[LaunchLens] Application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <main
          id="main-content"
          className="flex min-h-screen animate-[fadeInDown_240ms_ease-out_both] items-center justify-center px-4 py-12 motion-reduce:animate-none"
        >
          <div className="w-full max-w-lg rounded-xl border border-signal-challenges bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-signal-challenges text-signal-challenges">
              <AlertTriangle className="size-6" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Something went wrong
            </h1>
            <p className="mt-3 text-[15px] leading-7 text-foreground/80">
              LaunchLens hit an unexpected error. Your workspace draft is still
              saved locally in your browser — reloading should bring it right
              back.
            </p>

            {/* Show technical details only in development to avoid leaking internals */}
            {process.env.NODE_ENV !== "production" && error.message ? (
              <pre
                className="mt-4 overflow-x-auto rounded-md border border-signal-challenges bg-signal-challenges p-3 text-left font-mono text-[12px] leading-5 text-signal-challenges"
                role="alert"
              >
                {error.message}
              </pre>
            ) : null}

            {error.digest ? (
              <p className="mt-3 font-mono text-xs text-muted">
                Error ID: {error.digest}
              </p>
            ) : null}

            <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Try again
              </button>
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-input bg-card px-5 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2"
              >
                <Home className="size-4" aria-hidden="true" />
                Back to demo
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
