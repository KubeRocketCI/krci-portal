import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import type { Pod } from "@my-project/shared";
import { CompactEventsCard } from "../../../../components/workload/CompactEventsCard";

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
      <CompactEventsCard item={pod} />
      <PodPortsCard pod={pod} />
      <MetadataListCard title="Labels" entries={pod.metadata?.labels ?? {}} />
      <MetadataListCard title="Annotations" entries={pod.metadata?.annotations ?? {}} />
    </div>
  );
}
