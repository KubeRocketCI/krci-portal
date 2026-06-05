import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatRelativeTime } from "@/core/utils/date-humanize/utils";
import type { KubeObjectBase } from "@my-project/shared";
import { useResourceEvents } from "../../hooks/useResourceEvents";
import { getEventTimestamp, sortLatestEvents } from "../../utils/event";
import { eventToneClass } from "../../constants/event";

/**
 * Last-5 recent events for any namespaced object, matched by involvedObject
 * uid (preferred) or kind+name+namespace. Generalized from the Pod detail
 * sidebar's local `CompactEventsCard` so every workload overview can reuse it.
 */
export function CompactEventsCard({ item }: { item: KubeObjectBase }) {
  const { data, isLoading } = useResourceEvents(item);
  const events = data.array;

  const recent = useMemo(() => sortLatestEvents(events, 5), [events]);

  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-baseline justify-between text-sm font-semibold">
          <span>Events</span>
          <span className="text-muted-foreground text-xs">recent</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        {isLoading ? (
          <div className="text-muted-foreground text-xs">Loading events…</div>
        ) : recent.length === 0 ? (
          <div className="text-muted-foreground text-xs">No recent events for this resource.</div>
        ) : (
          <ul className="space-y-2">
            {recent.map((e, i) => {
              const ts = getEventTimestamp(e);
              return (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span
                    className={`mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${eventToneClass(e.type)}`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-foreground truncate font-mono">{e.reason ?? "—"}</span>
                      <span className="text-muted-foreground flex-shrink-0">{formatRelativeTime(ts)}</span>
                    </div>
                    {e.message && (
                      <Tooltip title={e.message}>
                        <span className="text-muted-foreground line-clamp-2 block">{e.message}</span>
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
