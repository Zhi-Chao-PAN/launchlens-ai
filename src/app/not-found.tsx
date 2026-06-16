import Link from "next/link";
import { Compass } from "lucide-react";

export const metadata = {
  title: "Page not found - LaunchLens AI",
};

export default function NotFound() {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-[#f6f8f4] px-4 py-12 text-[#17201d]">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-lg bg-[#17201d] text-white">
          <Compass className="size-6" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-[#d85b3f]">404</p>
        <h1 className="mt-1 text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm leading-6 text-[#40504a]">
          The page you are looking for does not exist or has been moved.
          Shared workspace links expire when the owner disables public sharing.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-[#17201d] px-5 text-sm font-semibold text-white transition hover:bg-[#24312d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a72] focus-visible:ring-offset-2"
        >
          Return to workspace
        </Link>
      </div>
    </main>
  );
}
