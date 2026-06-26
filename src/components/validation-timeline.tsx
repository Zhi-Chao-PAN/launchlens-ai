"use client";

import type { KeyboardEvent } from "react";
import type { HypothesisChangeEvent } from "@/lib/launchlens/execution";
import {
  formatValidationTimelineTime,
} from "@/lib/launchlens/validation-date-format";
import {
  TIMELINE_KIND_FILTERS,
  type TimelineKindFilter,
  timelineDotClass,
  timelineEventDetail,
  timelineEventIsTransition,
  timelineEventLabel,
  timelineEventTitle,
  timelineTokenClass,
  timelineValueDescription,
} from "@/lib/launchlens/validation-timeline";

export type ValidationTimelineProps = {
  experimentId: string;
  history: HypothesisChangeEvent[];
  expanded: boolean;
  selectedKind: string;
  onToggleExpanded: (experimentId: string) => void;
  onSelectKind: (experimentId: string, kind: TimelineKindFilter) => void;
  onEventClick: (
    experimentId: string,
    kind: HypothesisChangeEvent["kind"],
    targetId?: string,
  ) => void;
};

function readableFilterName(value: string) {
  return value
    .replace("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ValidationTimeline({
  experimentId,
  history,
  expanded,
  selectedKind,
  onToggleExpanded,
  onSelectKind,
  onEventClick,
}: ValidationTimelineProps) {
  if (history.length === 0) {
    return null;
  }

  const allTimeline = (expanded ? history : history.slice(-8)).slice().reverse();
  const visibleTimeline =
    selectedKind === "all"
      ? allTimeline
      : allTimeline.filter((event) => event.kind === selectedKind);
  const kindCounts: Record<string, number> = {};
  history.forEach((event) => {
    kindCounts[event.kind] = (kindCounts[event.kind] || 0) + 1;
  });

  const onTimelineKeyDown = (
    event: KeyboardEvent<HTMLSpanElement>,
    timelineEvent: HypothesisChangeEvent,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onEventClick(experimentId, timelineEvent.kind, timelineEvent.targetId);
    }
  };

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase text-muted">
          Timeline{" "}
          {history.length > 8 ? (
            <span className="ml-1 font-normal normal-case text-muted/70">
              ({history.length} events)
            </span>
          ) : null}
        </h3>
        {history.length > 8 ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleExpanded(experimentId);
            }}
            className="rounded-sm text-[11px] text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {expanded ? "Show recent" : "Show all " + history.length}
          </button>
        ) : null}
      </div>

      {history.length > 5 && (
        <div className="mb-1.5 flex flex-wrap gap-0.5">
          {TIMELINE_KIND_FILTERS.filter(
            (filter) => filter.id === "all" || kindCounts[filter.id],
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSelectKind(experimentId, filter.id);
              }}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition ${
                selectedKind === filter.id
                  ? "bg-accent text-white"
                  : "text-muted hover:bg-muted hover:text-foreground"
              }`}
              title={`Filter timeline to ${filter.label.toLowerCase()} events`}
              aria-pressed={selectedKind === filter.id}
            >
              {filter.label}{" "}
              {filter.id === "all"
                ? selectedKind === "all"
                  ? allTimeline.length
                  : visibleTimeline.length + "/" + allTimeline.length
                : kindCounts[filter.id] || 0}
            </button>
          ))}
        </div>
      )}

      {visibleTimeline.length === 0 && selectedKind !== "all" ? (
        <p className="text-[11px] italic text-muted">
          No {readableFilterName(selectedKind)} events in this view.
        </p>
      ) : (
        <ol className="space-y-1.5 border-l border-border/60 pl-5 overflow-visible">
          {visibleTimeline.map((timelineEvent) => {
            const timeLabel = formatValidationTimelineTime(timelineEvent.at);
            const kindLabel = timelineEventLabel(timelineEvent);
            const isTransition = timelineEventIsTransition(timelineEvent.kind);
            const detail = timelineEventDetail(timelineEvent);
            const dotColor = timelineDotClass(
              timelineEvent.kind,
              timelineEvent.to,
            );
            const fromDescription = timelineValueDescription(
              timelineEvent.kind,
              timelineEvent.from,
            );
            const toDescription = timelineEvent.to
              ? timelineValueDescription(timelineEvent.kind, timelineEvent.to)
              : undefined;
            const dotTitle = timelineEventTitle(timelineEvent);

            return (
              <li key={timelineEvent.id} className="relative text-xs leading-5">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    onEventClick(
                      experimentId,
                      timelineEvent.kind,
                      timelineEvent.targetId,
                    );
                  }}
                  onKeyDown={(event) =>
                    onTimelineKeyDown(event, timelineEvent)
                  }
                  className={
                    "absolute -left-[21px] top-2 size-2 cursor-pointer rounded-full ring-2 ring-background transition hover:scale-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
                    dotColor
                  }
                  title={dotTitle}
                  aria-label={"Timeline: " + dotTitle}
                />
                <span className="font-medium text-foreground/80">
                  {kindLabel}
                </span>
                {timelineEvent.label ? (
                  <span
                    className="ml-1.5 max-w-[180px] truncate text-muted"
                    title={timelineEvent.label}
                  >
                    &ldquo;{timelineEvent.label}&rdquo;
                  </span>
                ) : isTransition ? (
                  <span className="ml-1.5 text-muted">
                    <span
                      className={timelineTokenClass(timelineEvent.from)}
                      title={fromDescription}
                      aria-label={"From: " + fromDescription}
                    >
                      {timelineEvent.from ?? "?"}
                    </span>{" "}
                    <span className="text-muted-foreground/70">&rarr;</span>{" "}
                    <span
                      className={timelineTokenClass(timelineEvent.to)}
                      title={toDescription}
                      aria-label={toDescription}
                    >
                      {timelineEvent.to ?? "?"}
                    </span>
                  </span>
                ) : detail ? (
                  <span className="ml-1.5 text-muted">{detail}</span>
                ) : null}
                <span className="ml-1 text-[10px] text-muted/80">
                  &middot; {timeLabel}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
