"use client";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  shimmer?: boolean;
};

/**
 * Shared Skeleton primitive used across route-level loading states and
 * async panels. Defaults to a soft Tailwind pulse; pass shimmer={true} for
 * a higher-signal horizontal shimmer sweep used in the main app shell.
 */
export function Skeleton({
  className = "",
  rounded = "md",
  shimmer = false,
  ...rest
}: SkeletonProps) {
  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  if (shimmer) {
    return (
      <div
        role="status"
        aria-label="Loading"
        className={`relative overflow-hidden bg-[#e2e8df] ${roundedClasses[rounded]} ${className}`}
        {...rest}
      >
        <div
          aria-hidden="true"
          className="absolute inset-y-0 w-1/3 animate-[launchlens-shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent motion-reduce:animate-none"
        />
      </div>
    );
  }

  return (
    <div
      className={`animate-pulse bg-[#d8ded4] ${roundedClasses[rounded]} ${className}`}
      role="status"
      aria-label="Loading"
      {...rest}
    />
  );
}

type SkeletonCardProps = {
  lines?: number;
  title?: boolean;
};

export function SkeletonCard({ lines = 3, title = true }: SkeletonCardProps) {
  return (
    <div className="rounded-lg border border-[#d8ded4] bg-white p-4">
      {title && <Skeleton className="mb-3 h-5 w-1/3" />}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-3"
            style={{ width: `${85 - i * 10}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonText({
  lines = 3,
  heading = false,
}: {
  lines?: number;
  heading?: boolean;
}) {
  return (
    <div className="space-y-2">
      {heading && <Skeleton className="mb-2 h-6 w-1/4" />}
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width: `${90 - i * 15}%` }}
        />
      ))}
    </div>
  );
}
