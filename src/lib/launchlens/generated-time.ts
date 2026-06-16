export function formatGeneratedTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);

  return `${time} UTC`;
}

export function formatRelativeTime(value: string): string {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (Number.isNaN(date.getTime()) || diffMs < 0) {
    return "just now";
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  // Fall back to absolute date for older entries
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}
