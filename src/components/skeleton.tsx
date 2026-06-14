"use client";

import { ReactNode } from "react";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
};

export function Skeleton({
  className = "",
  rounded = "md",
  ...rest
}: SkeletonProps) {
  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 ${roundedClasses[rounded]} ${className}`}
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
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
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

