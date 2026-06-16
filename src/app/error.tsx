"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error("[LaunchLens] Application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f6f8f4] text-[#17201d]">
        <main id="main-content" className="flex min-h-screen items-center justify-center px-4 py-12">
          <div className="w-full max-w-md rounded-lg border border-[#e7c9bd] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#fff6f1] text-[#8b3d28]">
              <AlertTriangle className="size-6" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-semibold text-[#17201d]">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#40504a]">
              LaunchLens encountered an unexpected error. Your local workspace
              draft is still saved in your browser.
            </p>
            {error.digest && (
              <p className="mt-3 font-mono text-xs text-[#8e9c93]">
                Error ID: {error.digest}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#17201d] px-5 text-sm font-semibold text-white transition hover:bg-[#24312d]"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Try again
              </button>
              <Link
                href="/"
                className="inline-flex h-10 items-center justify-center rounded-md border border-[#cfd8d1] bg-white px-5 text-sm font-semibold text-[#17201d] transition hover:border-[#138a72]"
              >
                Return home
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
