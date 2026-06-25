import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CloudOff, Link2Off } from "lucide-react";
import { notFound } from "next/navigation";

import { SharedWorkspaceView } from "@/components/shared-workspace-view";
import {
  getSharedWorkspace,
  WorkspaceStoreError,
} from "@/lib/launchlens/workspace-store";
import { isUuid } from "@/lib/launchlens/workspace-validation";

export const dynamic = "force-dynamic";
// Shared workspace snapshots may contain private GTM material; keep them
// out of search engine indices even when the share link is reachable. The
// noindex directive is re-asserted inside generateMetadata so it always
// wins regardless of the per-id title/description overrides.
const NOINDEX_ROBOTS = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false },
} as const;

type SharedWorkspacePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: SharedWorkspacePageProps,
): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "Shared workspace - LaunchLens AI", robots: NOINDEX_ROBOTS };

  let title = "Shared GTM workspace - LaunchLens AI";
  let description =
    "A go-to-market workspace shared from LaunchLens AI. Explore target users, pains, backlog, validation experiments, and AI-grounded decision briefs.";
  let projectName = "";

  try {
    const result = await getSharedWorkspace(id);
    if (result.status === "ok") {
      const { workspace } = result.record;
      const headline = workspace.landingPage?.headline || "Shared workspace";
      title = `${headline} - LaunchLens AI shared workspace`;
      projectName = headline;
      if (workspace.summary?.length) {
        description = workspace.summary.slice(0, 160);
        if (workspace.summary.length > 160) description += "…";
      }
    } else if (result.status === "revoked") {
      title = "Link no longer available - LaunchLens AI";
      description =
        "This shared workspace link has been revoked by its owner.";
    }
  } catch (error) {
    if (
      error instanceof WorkspaceStoreError &&
      error.code === "cloud_unavailable"
    ) {
      title = "Workspace unavailable - LaunchLens AI";
      description =
        "Cloud storage is not configured on this deployment.";
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "LaunchLens AI",
      images: [
        {
          url: "/og.png",
          width: 1280,
          height: 640,
          alt: projectName
            ? `${projectName} - LaunchLens AI shared workspace`
            : "LaunchLens AI - shared GTM workspace",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
    robots: NOINDEX_ROBOTS,
  };
}

export default async function SharedWorkspacePage({
  params,
}: SharedWorkspacePageProps) {
  const { id } = await params;
  let record = null;
  let storageUnavailable = false;
  let shareRevoked = false;
  let shareExpired = false;

  if (!isUuid(id)) {
    notFound();
  }

  try {
    const result = await getSharedWorkspace(id);
    if (result.status === "ok") record = result.record;
    else if (result.status === "revoked") shareRevoked = true;
    else if (result.status === "expired") shareExpired = true;
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
      <main id="main-content" className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <section className="w-full max-w-md rounded-xl border border-card bg-card p-8 shadow-sm transition-colors">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <CloudOff className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Shared workspace unavailable
              </h1>
              <p className="text-xs text-muted">Storage not configured</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-foreground/80">
            Cloud workspace storage is not configured on this deployment, so
            shared links cannot be resolved right now. You can still explore
            the interactive demo and generate a fresh workspace locally.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-1.5 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Try the demo
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (shareExpired) {
    return (
      <main id="main-content" className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <section className="w-full max-w-md rounded-xl border border-card bg-card p-8 shadow-sm transition-colors">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Link2Off className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Link has expired</h1>
              <p className="text-xs text-muted">Shared link expired</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-foreground/80">
            The owner set an expiration window on this shared link and it has now passed. The workspace still exists, but this public link is no longer accessible.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/" className="inline-flex h-10 items-center gap-1.5 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              Try the demo
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (shareRevoked) {
    return (
      <main id="main-content" className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <section className="w-full max-w-md rounded-xl border border-card bg-card p-8 shadow-sm transition-colors">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Link2Off className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Link no longer available
              </h1>
              <p className="text-xs text-muted">Sharing was revoked</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-foreground/80">
            The owner has turned off public sharing for this workspace. It
            used to be public, but the link is now disabled. You can still
            explore the interactive demo and build a workspace of your own.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-1.5 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Try the demo
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
