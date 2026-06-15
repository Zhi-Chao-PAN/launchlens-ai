"use client";

import { ReactNode } from"react";

type EmptyStateProps = {
 title: string;
 description?: string;
 icon?: ReactNode;
 action?: ReactNode;
 size?:"sm"|"md"|"lg";
};

export function EmptyState({
 title,
 description,
 icon,
 action,
 size ="md",
}: EmptyStateProps) {
 const sizes = {
 sm:"py-6",
 md:"py-12",
 lg:"py-20",
 };

 const iconSizes = {
 sm:"h-8 w-8",
 md:"h-12 w-12",
 lg:"h-16 w-16",
 };

 const titleSizes = {
 sm:"text-sm",
 md:"text-base",
 lg:"text-lg",
 };

 return (
 <div
 className={`flex flex-col items-center justify-center ${sizes[size]} text-center`}
 role="status"
 aria-label="Empty state"
 >
 {icon && (
 <div
 className={`mb-3 flex ${iconSizes[size]} items-center justify-center rounded-full bg-slate-100 text-slate-400 `}
 >
 {icon}
 </div>
 )}
 <h3
 className={`font-medium text-slate-900 ${titleSizes[size]}`}
 >
 {title}
 </h3>
 {description && (
 <p className="mt-1 max-w-sm text-sm text-slate-500">
 {description}
 </p>
 )}
 {action && <div className="mt-4">{action}</div>}
 </div>
 );
}

// Common empty state variants
export function NoDataIcon() {
 return (
 <svg
 className="h-6 w-6"
 fill="none"
 viewBox="0 0 24 24"
 stroke="currentColor"
 strokeWidth={1.5}
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
 />
 </svg>
 );
}

export function SparkleIcon() {
 return (
 <svg
 className="h-6 w-6"
 fill="none"
 viewBox="0 0 24 24"
 stroke="currentColor"
 strokeWidth={1.5}
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
 />
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 d="M18.257 8.007L18 9.75l-.257-1.743a2.25 2.25 0 00-1.743-1.743L14.25 6l1.743-.257A2.25 2.25 0 0117.743 4L18 2.25l.257 1.743a2.25 2.25 0 001.743 1.743L21.75 6l-1.743.257a2.25 2.25 0 00-1.743 1.743z"
 />
 </svg>
 );
}

export function SearchIcon() {
 return (
 <svg
 className="h-6 w-6"
 fill="none"
 viewBox="0 0 24 24"
 stroke="currentColor"
 strokeWidth={1.5}
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
 />
 </svg>
 );
}
