import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Skeleton } from "@/core/components/ui/skeleton";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatRelativeTime } from "@/core/utils/date-humanize/utils";
import { PATH_K8S_EVENTS_FULL } from "@/modules/k8s/constants/paths";
import { EVENT_TONE } from "@/modules/k8s/constants/event";
import type { UseWatchListResult } from "@/k8s/api/hooks/useWatch/types";
import type { OverviewEvent } from "../types";

const MAX_EVENTS = 25;

function eventTimestamp(event: OverviewEvent): string | undefined {
  return event.lastTimestamp ?? event.eventTime ?? event.metadata?.creationTimestamp;
}

function eventTime(event: OverviewEvent): number {
  const raw = eventTimestamp(event);
  if (!raw) return 0;
  const time = new Date(raw).getTime();
  return Number.isFinite(time) ? time : 0;
}

interface RecentEventsCardProps {
  clusterName: string;
  result: UseWatchListResult<OverviewEvent>;
}

export function RecentEventsCard({ clusterName, result }: RecentEventsCardProps) {
  const sorted = useMemo(
    () => [...result.data.array].sort((a, b) => eventTime(b) - eventTime(a)).slice(0, MAX_EVENTS),
    [result.data.array]
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
        <CardTitle className="text-sm font-semibold">Recent events</CardTitle>
        <Link
          to={PATH_K8S_EVENTS_FULL}
          params={{ clusterName }}
          className="text-muted-foreground hover:text-foreground text-xs"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="p-4 pt-1">
        {result.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">No recent events.</p>
        ) : (
          <ul className="max-h-80 space-y-2.5 overflow-y-auto pr-1">
            {sorted.map((event, index) => {
              const timestamp = eventTimestamp(event);
              return (
                <li
                  key={event.metadata?.uid ?? `${timestamp ?? "event"}-${index}`}
                  className="flex items-start gap-2 text-xs"
                >
                  <span
                    className={`mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                      EVENT_TONE[event.type ?? ""] ?? "bg-muted-foreground"
                    }`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-foreground truncate font-mono">{event.reason ?? "—"}</span>
                      <span className="text-muted-foreground shrink-0">{formatRelativeTime(timestamp)}</span>
                    </div>
                    <div className="text-muted-foreground truncate">
                      {event.involvedObject?.kind}
                      {event.involvedObject?.name ? ` · ${event.involvedObject.name}` : ""}
                    </div>
                    {event.message && (
                      <Tooltip title={event.message}>
                        <span className="text-muted-foreground line-clamp-2 block">{event.message}</span>
                      </Tooltip>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
