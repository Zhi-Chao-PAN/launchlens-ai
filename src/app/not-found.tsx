import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Page not found - LaunchLens AI",
};

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen animate-[fadeInDown_280ms_ease-out_both] items-center justify-center bg-[#f6f8f4] px-4 py-12 text-[#17201d] motion-reduce:animate-none"
    >
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-xl bg-[#17201d] text-white shadow-sm">
          <Compass className="size-6" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#d85b3f]">
          404 — Off the launch map
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          That page could not be found
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-[#40504a]">
          The page you are looking for does not exist, has been moved, or the
          shared workspace link has expired when its owner disabled public
          sharing.
        </p>
        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#138a72] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f7665] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cbe8df] focus-visible:ring-offset-2"
          >
            Open the demo workspace
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#cfd8d1] bg-white px-5 text-sm font-semibold text-[#17201d] transition hover:border-[#138a72] hover:text-[#138a72] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cbe8df] focus-visible:ring-offset-2"
          >
            View pricing
          </Link>
        </div>
      </div>
    </main>
  );
}
