import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Tooltip } from "@/core/components/ui/tooltip";
import { useK8sResourceList } from "../../../../hooks/useK8sResourceList";
import { formatRelativeTime } from "@/core/utils/date-humanize/utils";
import { k8sEventConfig } from "@my-project/shared";
import type { KubeObjectBase, Pod } from "@my-project/shared";
import { EVENT_TONE } from "../../../../constants/event";

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

function CompactEventsCard({ pod }: { pod: Pod }) {
  const ns = pod.metadata?.namespace ?? "";
  const result = useK8sResourceList<K8sEvent>(k8sEventConfig, ns);
  const events = result.data.array;

  const filtered = events
    .filter(
      (e) =>
        e.involvedObject?.uid === pod.metadata?.uid ||
        (e.involvedObject?.kind === "Pod" &&
          e.involvedObject?.name === pod.metadata?.name &&
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
          <div className="text-muted-foreground text-xs">No events for this pod.</div>
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

function PodPortsCard({ pod }: { pod: Pod }) {
  const containers = pod.spec?.containers ?? [];
  const ports: Array<{ containerName: string; containerPort: number; protocol?: string; name?: string }> = [];
  for (const c of containers) {
    for (const p of c.ports ?? []) {
      ports.push({ containerName: c.name, containerPort: p.containerPort, protocol: p.protocol, name: p.name });
    }
  }
  if (ports.length === 0) return null;

  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm font-semibold">Ports</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <ul className="space-y-1.5">
          {ports.map((p, i) => (
            <li key={i} className="flex items-center justify-between gap-2 text-xs">
              <span className="font-mono">{p.containerPort}</span>
              <div className="flex items-center gap-1">
                {p.protocol && (
                  <Badge variant="outline" className="text-[10px]">
                    {p.protocol}
                  </Badge>
                )}
                {p.name && <span className="text-muted-foreground max-w-[120px] truncate font-mono">{p.name}</span>}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function MetadataListCard({ title, entries }: { title: string; entries: Record<string, string | undefined> }) {
  const items = Object.entries(entries).filter((entry): entry is [string, string] => entry[1] !== undefined);
  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-baseline justify-between text-sm font-semibold">
          <span>{title}</span>
          <span className="text-muted-foreground text-xs">{items.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        {items.length === 0 ? (
          <div className="text-muted-foreground text-xs">—</div>
        ) : (
          <ul className="max-h-56 space-y-1 overflow-y-auto pr-1 font-mono text-xs">
            {items.map(([k, v]) => (
              <li key={k} className="break-all">
                <span className="text-muted-foreground">{k}:</span> <span>{v}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function PodOverviewSidebar({ pod }: { pod: Pod }) {
  return (
    <div className="flex flex-col gap-3">
      <CompactEventsCard pod={pod} />
      <PodPortsCard pod={pod} />
      <MetadataListCard title="Labels" entries={pod.metadata?.labels ?? {}} />
      <MetadataListCard title="Annotations" entries={pod.metadata?.annotations ?? {}} />
    </div>
  );
}
