const VALIDATION_TIME_ZONE = "UTC";

const timelineFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: VALIDATION_TIME_ZONE,
  timeZoneName: "short",
});

const evidenceDateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  timeZone: VALIDATION_TIME_ZONE,
});

const evidenceDateTitleFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
  timeZone: VALIDATION_TIME_ZONE,
});

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function formatValidationTimelineTime(value: string) {
  const date = parseDate(value);
  return date ? timelineFormatter.format(date) : "Unknown date";
}

export function formatValidationObservedDate(value: string) {
  const date = parseDate(value);
  return date ? evidenceDateFormatter.format(date) : "Unknown";
}

export function formatValidationObservedDateTitle(value: string) {
  const date = parseDate(value);
  return date ? evidenceDateTitleFormatter.format(date) : "Unknown date";
}
