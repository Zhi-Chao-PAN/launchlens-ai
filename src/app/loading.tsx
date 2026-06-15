export default function Loading() {
  return (
    <main className="min-h-screen bg-[#f6f8f4]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 border-b border-[#d8ded4] pb-5">
          <div className="h-11 w-11 animate-pulse rounded-lg bg-[#d8ded4]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-[#d8ded4]" />
            <div className="h-6 w-48 animate-pulse rounded bg-[#d8ded4]" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="h-96 animate-pulse rounded-lg border border-[#d8ded4] bg-white p-5" />
          <div className="space-y-6">
            <div className="h-64 animate-pulse rounded-lg border border-[#d8ded4] bg-white p-5" />
            <div className="h-80 animate-pulse rounded-lg border border-[#d8ded4] bg-white p-5" />
            <div className="h-72 animate-pulse rounded-lg border border-[#d8ded4] bg-white p-5" />
          </div>
        </div>
      </div>
    </main>
  );
}
