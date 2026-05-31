import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatRelativeTime } from "@/core/utils/date-humanize/utils";
import { k8sEventConfig } from "@my-project/shared";
import type { KubeObjectBase } from "@my-project/shared";
import { useK8sResourceList } from "../../hooks/useK8sResourceList";
import { EVENT_TONE } from "../../constants/event";

interface K8sEvent extends KubeObjectBase {
  type?: string;
  reason?: string;
  message?: string;
  count?: number;
  lastTimestamp?: string;
  eventTime?: string;
  firstTimestamp?: string;
  involvedObject?: {
    kind?: string;
    namespace?: string;
    name?: string;
    uid?: string;
  };
}

/**
 * Last-5 recent events for any namespaced object, matched by involvedObject
 * uid (preferred) or kind+name+namespace. Generalized from the Pod detail
 * sidebar's local `CompactEventsCard` so every workload overview can reuse it.
 */
export function CompactEventsCard({ item }: { item: KubeObjectBase }) {
  const ns = item.metadata?.namespace ?? "";
  const kind = (item as { kind?: string }).kind;
  const result = useK8sResourceList<K8sEvent>(k8sEventConfig, ns);
  const events = result.data.array;

  const filtered = events
    .filter(
      (e) =>
        e.involvedObject?.uid === item.metadata?.uid ||
        (e.involvedObject?.kind === kind &&
          e.involvedObject?.name === item.metadata?.name &&
          e.involvedObject?.namespace === ns)
    )
    .sort((a, b) => {
      const ta = new Date(a.lastTimestamp ?? a.eventTime ?? a.metadata?.creationTimestamp ?? 0).getTime();
      const tb = new Date(b.lastTimestamp ?? b.eventTime ?? b.metadata?.creationTimestamp ?? 0).getTime();
      return tb - ta;
    })
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-baseline justify-between text-sm font-semibold">
          <span>Events</span>
          <span className="text-muted-foreground text-xs">recent</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        {filtered.length === 0 ? (
          <div className="text-muted-foreground text-xs">No recent events for this resource.</div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((e, i) => {
              const ts = e.lastTimestamp ?? e.eventTime ?? e.metadata?.creationTimestamp;
              return (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span
                    className={`mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                      EVENT_TONE[e.type ?? ""] ?? "bg-muted-foreground"
                    }`}
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
