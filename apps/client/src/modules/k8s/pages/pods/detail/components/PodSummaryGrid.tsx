import { Card } from "@/core/components/ui/card";
import { StatusBadge } from "@/core/components/StatusBadge";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatRelativeTime, formatTimestamp } from "@/core/utils/date-humanize/utils";
import {
  getPodReadyCounts,
  getPodRestartCount,
  getPodStatusIcon,
  getPodStatusLabel,
} from "@/k8s/api/groups/Core/Pod/utils/getStatusIcon";
import type { Pod } from "@my-project/shared";

interface SummaryCardProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}

function SummaryCard({ label, value, sub }: SummaryCardProps) {
  return (
    <Card className="flex min-w-0 flex-col gap-1 p-3">
      <div className="text-muted-foreground text-[11px] tracking-wide uppercase">{label}</div>
      <div className="text-foreground min-w-0 truncate text-sm font-medium">{value}</div>
      {sub !== undefined && <div className="text-muted-foreground truncate text-xs">{sub}</div>}
    </Card>
  );
}

export function PodSummaryGrid({ pod }: { pod: Pod }) {
  const statusIcon = getPodStatusIcon(pod);
  const statusLabel = getPodStatusLabel(pod);
  const { ready, total } = getPodReadyCounts(pod);
  const restarts = getPodRestartCount(pod);
  const node = pod.spec?.nodeName;
  const hostIP = pod.status?.hostIP;
  const podIP = pod.status?.podIP;
  const created = pod.metadata?.creationTimestamp;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <SummaryCard label="Status" value={<StatusBadge statusIcon={statusIcon} label={statusLabel} />} sub="Phase" />
      <SummaryCard label="Ready" value={`${ready} / ${total}`} sub="Containers" />
      <SummaryCard label="Restarts" value={restarts} sub="All containers" />
      <SummaryCard
        label="Node"
        value={
          node ? <span className="font-mono text-xs">{node}</span> : <span className="text-muted-foreground">—</span>
        }
        sub={hostIP ? <span className="font-mono">{hostIP}</span> : "—"}
      />
      <SummaryCard
        label="Pod IP"
        value={
          podIP ? <span className="font-mono text-xs">{podIP}</span> : <span className="text-muted-foreground">—</span>
        }
        sub="Cluster IP"
      />
      <SummaryCard
        label="Created"
        value={formatRelativeTime(created)}
        sub={
          created ? (
            <Tooltip title={created}>
              <span>{formatTimestamp(created)}</span>
            </Tooltip>
          ) : (
            "—"
          )
        }
      />
    </div>
  );
}
