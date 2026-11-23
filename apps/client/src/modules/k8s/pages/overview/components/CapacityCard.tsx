import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Skeleton } from "@/core/components/ui/skeleton";
import type { Node as K8sNode, Pod } from "@my-project/shared";
import type { UseWatchListResult } from "@/k8s/api/hooks/useWatch/types";
import { UsageBar } from "@/core/components/UsageBar";
import { formatCores, formatMemory } from "@/core/utils/quantity";
import { computeClusterResources, type ResourceUsage } from "../utils/quantity";

interface CapacityCardProps {
  nodes: UseWatchListResult<K8sNode>;
  pods: UseWatchListResult<Pod>;
}

export function CapacityCard({ nodes, pods }: CapacityCardProps) {
  const totals = useMemo(
    () => computeClusterResources(nodes.data.array, pods.data.array),
    [nodes.data.array, pods.data.array]
  );
  const loading = nodes.isLoading || pods.isLoading;

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold">Compute capacity</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 p-4 pt-2 sm:grid-cols-2">
        <ResourceBlock title="CPU" unit="cores" usage={totals.cpu} format={formatCores} loading={loading} />
        <ResourceBlock title="Memory" usage={totals.memory} format={formatMemory} loading={loading} />
      </CardContent>
    </Card>
  );
}

interface ResourceBlockProps {
  title: string;
  unit?: string;
  usage: ResourceUsage;
  format: (value: number) => string;
  loading: boolean;
}

function ResourceBlock({ title, unit, usage, format, loading }: ResourceBlockProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-muted-foreground text-xs">
          {loading ? "—" : `${format(usage.capacity)}${unit ? ` ${unit}` : ""} allocatable`}
        </span>
      </div>
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-full" />
        </div>
      ) : (
        <>
          <UsageBar label="Requests" value={usage.requests} max={usage.capacity} format={format} showPercent />
          <UsageBar label="Limits" value={usage.limits} max={usage.capacity} format={format} showPercent />
        </>
      )}
    </div>
  );
}
