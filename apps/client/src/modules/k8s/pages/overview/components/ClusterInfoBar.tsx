import { Cpu, Server, Tag, Boxes } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/core/components/ui/skeleton";

interface ClusterInfoBarProps {
  clusterName?: string;
  kubernetesVersion?: string;
  platform?: string;
  nodeCount: number;
  loading: boolean;
}

export function ClusterInfoBar({ clusterName, kubernetesVersion, platform, nodeCount, loading }: ClusterInfoBarProps) {
  return (
    <div className="bg-card flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg border px-4 py-3">
      <InfoChip icon={Boxes} label="Cluster" value={clusterName || "—"} />
      <InfoChip icon={Tag} label="Kubernetes" value={kubernetesVersion} loading={loading} />
      <InfoChip icon={Server} label="Platform" value={platform} loading={loading} />
      <InfoChip icon={Cpu} label="Nodes" value={String(nodeCount)} loading={loading} />
    </div>
  );
}

function InfoChip({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="text-muted-foreground text-[10px] tracking-wide uppercase">{label}</p>
        {loading ? (
          <Skeleton className="mt-0.5 h-4 w-24" />
        ) : (
          <p className="truncate text-sm font-medium">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}
