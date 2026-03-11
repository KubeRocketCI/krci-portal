import { STATUS_COLOR, MAIN_COLOR } from "@/k8s/constants/colors";
import { Gauge, Cpu, MemoryStick, Container } from "lucide-react";

import { DashboardCard } from "@/modules/platform/overview/components/DashboardCard";
import { LoadingState } from "@/modules/platform/overview/components/LoadingState";
import { EmptyState } from "@/modules/platform/overview/components/EmptyState";
import { useNamespaceResourceUsage } from "@/modules/platform/overview/hooks/useNamespaceResourceUsage";

function formatCpu(cores: number): string {
  if (cores < 0.001) return `${Math.round(cores * 1_000_000)}µ`;
  if (cores < 1) return `${Math.round(cores * 1000)}m`;
  return `${cores.toFixed(2)}`;
}

function formatMemory(mi: number): string {
  if (mi >= 1024) return `${(mi / 1024).toFixed(1)} Gi`;
  return `${Math.round(mi)} Mi`;
}

export function ResourceUsage() {
  const { data, isLoading, isError } = useNamespaceResourceUsage();

  return (
    <DashboardCard title="Resource Usage" icon={Gauge} iconColor={MAIN_COLOR.BLUE}>
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <EmptyState message="Failed to load resource usage data" />
      ) : !data || data.podCount === 0 ? (
        <EmptyState message="No running pods found" />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center rounded-lg bg-gray-50 p-3">
              <Cpu className="mb-1 size-4" style={{ color: MAIN_COLOR.BLUE }} />
              <span className="text-foreground text-lg font-semibold">{formatCpu(data.totalCpuCores)}</span>
              <span className="text-muted-foreground text-xs">CPU</span>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-gray-50 p-3">
              <MemoryStick className="mb-1 size-4" style={{ color: MAIN_COLOR.DARK_PURPLE }} />
              <span className="text-foreground text-lg font-semibold">{formatMemory(data.totalMemoryMi)}</span>
              <span className="text-muted-foreground text-xs">Memory</span>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-gray-50 p-3">
              <Container className="mb-1 size-4" style={{ color: STATUS_COLOR.SUCCESS }} />
              <span className="text-foreground text-lg font-semibold">{data.podCount}</span>
              <span className="text-muted-foreground text-xs">Pods</span>
            </div>
          </div>

          {data.topPods.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">Top pods by CPU</p>
              <div className="space-y-2">
                {data.topPods.map((pod) => (
                  <div key={pod.name} className="flex items-center justify-between text-sm">
                    <span className="text-foreground max-w-[55%] truncate" title={pod.name}>
                      {pod.name}
                    </span>
                    <div className="text-muted-foreground flex gap-3 text-xs">
                      <span>{formatCpu(pod.cpuCores)}</span>
                      <span>{formatMemory(pod.memoryMi)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardCard>
  );
}
