import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CloudOff } from "lucide-react";
import { notFound } from "next/navigation";

import { SharedWorkspaceView } from "@/components/shared-workspace-view";
import {
  getSharedWorkspace,
  WorkspaceStoreError,
} from "@/lib/launchlens/workspace-store";
import { isUuid } from "@/lib/launchlens/workspace-validation";

export const dynamic = "force-dynamic";

type SharedWorkspacePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: SharedWorkspacePageProps,
): Promise<Metadata> {
  // Avoid a second DB round-trip during SSR by returning a generic title.
  // The page itself renders the workspace headline in <h1> for screen readers.
  const { id } = await params;
  if (!isUuid(id)) return { title: "Shared workspace - LaunchLens AI" };
  return {
    title: "Shared GTM workspace - LaunchLens AI",
    description: "A go-to-market workspace shared from LaunchLens AI.",
    openGraph: {
      title: "Shared GTM workspace - LaunchLens AI",
      description: "View a shared LaunchLens AI go-to-market workspace.",
      type: "article",
    },
  };
}

export default async function SharedWorkspacePage({
  params,
}: SharedWorkspacePageProps) {
  const { id } = await params;
  let record = null;
  let storageUnavailable = false;

  if (!isUuid(id)) {
    notFound();
  }

  try {
    record = await getSharedWorkspace(id);
  } catch (error) {
    if (
      error instanceof WorkspaceStoreError &&
      error.code === "cloud_unavailable"
    ) {
      storageUnavailable = true;
    } else {
      throw error;
    }
  }

  if (storageUnavailable) {
    return (
      <main id="main-content" className="flex min-h-screen items-center justify-center bg-[#f6f8f4] px-4">
        <section className="w-full max-w-lg rounded-lg border border-[#d8ded4] bg-white p-6 shadow-sm">
          <span className="mb-3 inline-flex size-11 items-center justify-center rounded-lg bg-[#fff6f1] text-[#d85b3f]">
            <CloudOff className="size-5" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-semibold text-[#17201d]">
            Shared workspace unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#40504a]">
            Cloud workspace storage is not configured on this deployment, so
            shared links cannot be resolved right now. You can still explore
            the interactive demo and generate a fresh workspace locally.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[#138a72] px-3 text-sm font-semibold text-white transition hover:bg-[#0f7665] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cbe8df] focus-visible:ring-offset-2"
            >
              Back to demo
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!record) {
    notFound();
  }

  return <SharedWorkspaceView record={record} />;
}
