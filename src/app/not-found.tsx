import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Page not found - LaunchLens AI",
};

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen animate-[fadeInDown_280ms_ease-out_both] items-center justify-center bg-background px-4 py-12 text-foreground motion-reduce:animate-none"
    >
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-xl bg-foreground text-white shadow-sm">
          <Compass className="size-6" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-wider text-signal-challenges">
          404 — Off the launch map
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          That page could not be found
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-foreground/80">
          The page you are looking for does not exist, has been moved, or the
          shared workspace link has expired when its owner disabled public
          sharing.
        </p>
        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2"
          >
            Open the demo workspace
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-input bg-card px-5 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2"
          >
            View pricing
          </Link>
        </div>
      </div>
    </main>
  );
}
