import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { StatusBadge } from "@/core/components/StatusBadge";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatRelativeTime, formatTimestamp } from "@/core/utils/date-humanize/utils";
import {
  getHPAStatusIcon,
  getHPAStatusLabel,
} from "@/k8s/api/groups/autoscaling/HorizontalPodAutoscaler/utils/getStatus";
import type { HorizontalPodAutoscaler, KubeCondition, KubeObjectBase } from "@my-project/shared";
import { ConditionsTable } from "../ConditionsTable";
import {
  WorkloadInfoRow,
  WorkloadInformationCard,
  WorkloadOverviewSidebar,
  WorkloadSummaryCard,
  WorkloadSummaryGrid,
} from "../workload";

interface HPAResourceMetricView {
  name?: string;
  current?: { averageUtilization?: number; averageValue?: string; value?: string };
  target?: { averageUtilization?: number; averageValue?: string; value?: string; type?: string };
}

interface HPAMetricView {
  type?: string;
  resource?: HPAResourceMetricView;
  pods?: HPAResourceMetricView;
  object?: HPAResourceMetricView & { metric?: { name?: string } };
  external?: HPAResourceMetricView & { metric?: { name?: string } };
}

interface HPASpecView {
  scaleTargetRef?: { kind?: string; name?: string; apiVersion?: string };
  minReplicas?: number;
  maxReplicas?: number;
  targetCPUUtilizationPercentage?: number;
  metrics?: HPAMetricView[];
}

interface HPAStatusView {
  currentReplicas?: number;
  desiredReplicas?: number;
  currentCPUUtilizationPercentage?: number;
  lastScaleTime?: string;
  currentMetrics?: HPAMetricView[];
  conditions?: KubeCondition[];
}

interface MetricRow {
  name: string;
  current: string;
  target: string;
}

const fmtPercent = (v?: number) => (v === undefined ? "—" : `${v}%`);

const metricName = (m: HPAMetricView): string => {
  if (m.resource?.name) return `Resource: ${m.resource.name}`;
  if (m.pods?.name) return `Pods: ${m.pods.name}`;
  if (m.object?.metric?.name) return `Object: ${m.object.metric.name}`;
  if (m.external?.metric?.name) return `External: ${m.external.metric.name}`;
  return m.type ?? "metric";
};

const metricCurrent = (m: HPAMetricView): string => {
  const src = m.resource?.current ?? m.pods?.current ?? m.object?.current ?? m.external?.current;
  if (!src) return "—";
  if (src.averageUtilization !== undefined) return `${src.averageUtilization}%`;
  return src.averageValue ?? src.value ?? "—";
};

const metricTarget = (m: HPAMetricView): string => {
  const src = m.resource?.target ?? m.pods?.target ?? m.object?.target ?? m.external?.target;
  if (!src) return "—";
  if (src.averageUtilization !== undefined) return `${src.averageUtilization}%`;
  return src.averageValue ?? src.value ?? "—";
};

const buildMetricRows = (spec: HPASpecView, status: HPAStatusView): MetricRow[] => {
  // autoscaling/v2: pair spec.metrics with status.currentMetrics by index.
  if (spec.metrics && spec.metrics.length > 0) {
    return spec.metrics.map((m, idx) => {
      const cur = status.currentMetrics?.[idx];
      return {
        name: metricName(m),
        current: cur ? metricCurrent(cur) : "—",
        target: metricTarget(m),
      };
    });
  }
  // autoscaling/v1: single CPU utilization row.
  if (spec.targetCPUUtilizationPercentage !== undefined || status.currentCPUUtilizationPercentage !== undefined) {
    return [
      {
        name: "Resource: cpu",
        current: fmtPercent(status.currentCPUUtilizationPercentage),
        target: fmtPercent(spec.targetCPUUtilizationPercentage),
      },
    ];
  }
  return [];
};

export function HPAOverviewTab({ item }: { item: KubeObjectBase }) {
  const hpa = item as HorizontalPodAutoscaler;
  const spec = (hpa.spec ?? {}) as HPASpecView;
  const status = (hpa.status ?? {}) as HPAStatusView;

  const created = hpa.metadata?.creationTimestamp;
  const minReplicas = spec.minReplicas;
  const maxReplicas = spec.maxReplicas;
  const currentReplicas = status.currentReplicas ?? 0;
  const desiredReplicas = status.desiredReplicas ?? 0;
  const scaleTargetRef = spec.scaleTargetRef;
  const lastScaleTime = status.lastScaleTime;
  const conditions = (status.conditions ?? []) as KubeCondition[];
  const metricRows = buildMetricRows(spec, status);

  return (
    <div className="flex flex-col gap-4 p-4">
      <WorkloadSummaryGrid>
        <WorkloadSummaryCard
          label="Status"
          value={<StatusBadge statusIcon={getHPAStatusIcon(hpa)} label={getHPAStatusLabel(hpa)} />}
          sub="Health"
        />
        <WorkloadSummaryCard label="Min Replicas" value={minReplicas ?? "—"} sub="Lower bound" />
        <WorkloadSummaryCard label="Max Replicas" value={maxReplicas ?? "—"} sub="Upper bound" />
        <WorkloadSummaryCard label="Current" value={currentReplicas} sub="Replicas" />
        <WorkloadSummaryCard label="Desired" value={desiredReplicas} sub="Replicas" />
        <WorkloadSummaryCard
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
      </WorkloadSummaryGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base font-semibold">Metrics</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {metricRows.length === 0 ? (
                <div className="text-muted-foreground p-4 text-sm">No metrics configured.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground border-b text-left text-xs">
                        <th className="px-4 py-2 font-medium">Metric</th>
                        <th className="px-4 py-2 font-medium">Current</th>
                        <th className="px-4 py-2 font-medium">Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricRows.map((row, idx) => (
                        <tr key={`${row.name}-${idx}`} className="border-b last:border-0">
                          <td className="px-4 py-2 font-mono text-xs">{row.name}</td>
                          <td className="px-4 py-2 tabular-nums">{row.current}</td>
                          <td className="px-4 py-2 tabular-nums">{row.target}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base font-semibold">Conditions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ConditionsTable conditions={conditions} />
            </CardContent>
          </Card>

          <WorkloadInformationCard>
            <WorkloadInfoRow label="Scale Target" mono>
              {scaleTargetRef ? `${scaleTargetRef.kind ?? ""}/${scaleTargetRef.name ?? ""}` : "—"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Min Replicas">{minReplicas ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Max Replicas">{maxReplicas ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Last Scale Time">
              {lastScaleTime ? (
                <Tooltip title={lastScaleTime}>
                  <span>{formatRelativeTime(lastScaleTime)}</span>
                </Tooltip>
              ) : (
                "—"
              )}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="UID" mono full>
              {hpa.metadata?.uid ?? "—"}
            </WorkloadInfoRow>
          </WorkloadInformationCard>
        </div>
        <div className="lg:col-span-1">
          <WorkloadOverviewSidebar item={item} />
        </div>
      </div>
    </div>
  );
}
