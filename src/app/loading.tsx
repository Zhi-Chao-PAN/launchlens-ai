import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-[#f6f8f4]"
      aria-busy="true"
      aria-label="Loading workspace"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Top bar: workspace avatar + title + subtitle */}
        <div className="flex items-center gap-3 border-b border-[#d8ded4] pb-5">
          <Skeleton shimmer rounded="lg" className="h-11 w-11 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton shimmer className="h-3 w-28" />
            <Skeleton shimmer className="h-6 w-56" />
          </div>
          <div className="hidden gap-2 sm:flex">
            <Skeleton shimmer rounded="md" className="h-9 w-24" />
            <Skeleton shimmer rounded="md" className="h-9 w-28" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Sidebar: workspace info / brief summary */}
          <aside
            aria-hidden="true"
            className="space-y-4 rounded-lg border border-[#d8ded4] bg-white p-5"
          >
            <Skeleton shimmer className="h-5 w-24" />
            <Skeleton shimmer className="h-3 w-full" />
            <Skeleton shimmer className="h-3 w-4/5" />
            <Skeleton shimmer className="h-3 w-3/5" />
            <div className="pt-3">
              <Skeleton shimmer className="mb-3 h-4 w-20" />
              <div className="space-y-2">
                <Skeleton shimmer className="h-8 w-full" />
                <Skeleton shimmer className="h-8 w-full" />
                <Skeleton shimmer className="h-8 w-4/5" />
              </div>
            </div>
          </aside>

          {/* Main column: cards */}
          <section className="space-y-6" aria-hidden="true">
            {[220, 300, 260].map((h, i) => (
              <div
                key={i}
                className="space-y-4 rounded-lg border border-[#d8ded4] bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <Skeleton shimmer className="h-5 w-40" />
                  <Skeleton shimmer rounded="full" className="h-7 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton shimmer className="h-3 w-full" />
                  <Skeleton shimmer className="h-3 w-[92%]" />
                  <Skeleton shimmer className="h-3 w-[78%]" />
                </div>
                <Skeleton shimmer style={{ height: `${h - 90}px` }} className="w-full" />
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
