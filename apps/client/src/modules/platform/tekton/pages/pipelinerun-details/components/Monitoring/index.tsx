import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { MAX_PIPELINE_RUN_PODS, type MetricSeriesByApp } from "@my-project/shared";
import { Card } from "@/core/components/ui/card";
import { MetricChart } from "@/core/components/metrics/MetricChart";
import { Section } from "@/core/components/metrics/Section";
import { StatPanel } from "@/core/components/metrics/StatPanel";
import { MetricsCursorProvider } from "@/core/components/metrics/hooks/MetricsCursorProvider";
import type { MetricUnit } from "@/core/components/metrics/types";
import { formatPercent, formatValue } from "@/core/components/metrics/utils";
import { usePipelineRunContext } from "../../providers/PipelineRun/hooks";
import { routePipelineRunDetails } from "../../route";
import { usePipelineRunMetrics } from "./hooks/usePipelineRunMetrics";
import {
  collectTaskPods,
  formatCpuSeconds,
  formatDurationShort,
  isAllEmpty,
  MIN_SAMPLABLE_DURATION_SECONDS,
  peakValue,
  taskHasSamples,
  taskSeriesToChartData,
  totalCpuSeconds,
  toUnixSeconds,
  WINDOW_PADDING_SECONDS,
} from "./utils";

const TOUR_PREFIX = "pipelinerun-monitoring";

type TaskMetricKey = "cpu" | "memory" | "cpuThrottling";

const TASK_CHART_DEFS: ReadonlyArray<{ key: TaskMetricKey; label: string; unit: MetricUnit }> = [
  { key: "cpu", label: "CPU usage", unit: "cores" },
  { key: "memory", label: "Memory (working set)", unit: "MiB" },
  { key: "cpuThrottling", label: "CPU throttling", unit: "percent" },
];

// Stable references so React.memo'd charts aren't re-rendered by prop churn.
const EMPTY_CHART_DATA: MetricSeriesByApp[] = [];
const formatMiB = (v: number) => formatValue("MiB", v);

function NoticeCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="p-6" data-tour={TOUR_PREFIX}>
      <h3 className="text-foreground mb-4 text-xl font-semibold">Monitoring</h3>
      <div className="text-muted-foreground text-sm">{children}</div>
    </Card>
  );
}

export function Monitoring() {
  const { clusterName, namespace } = routePipelineRunDetails.useParams();
  const { pipelineRun, pipelineRunTasksByNameMap, isLoading: runIsLoading } = usePipelineRunContext();

  // The server rejects requests above MAX_PIPELINE_RUN_PODS, so a huge
  // fan-out pipeline (e.g. Tekton matrix) is truncated to the first N tasks
  // in execution order rather than breaking the whole tab.
  const { pods, truncatedTaskCount } = React.useMemo(() => {
    const allPods = collectTaskPods(pipelineRunTasksByNameMap);
    return {
      pods: allPods.slice(0, MAX_PIPELINE_RUN_PODS),
      truncatedTaskCount: Math.max(0, allPods.length - MAX_PIPELINE_RUN_PODS),
    };
  }, [pipelineRunTasksByNameMap]);

  const startTime = toUnixSeconds(pipelineRun?.status?.startTime);
  const completionTime = toUnixSeconds(pipelineRun?.status?.completionTime);
  const isInFlight = pipelineRun !== undefined && completionTime === undefined;

  const metrics = usePipelineRunMetrics({
    clusterName,
    namespace,
    pods,
    start: startTime !== undefined ? startTime - WINDOW_PADDING_SECONDS : 0,
    // Undefined while in flight — the server substitutes "now" so the window
    // follows the run and the 30s auto-refresh picks up new samples.
    end: completionTime !== undefined ? completionTime + WINDOW_PADDING_SECONDS : undefined,
    enabled: startTime !== undefined && pods.length > 0,
  });

  const data = metrics.data;

  // Memoised so MetricChart's React.memo isn't defeated by a fresh Error
  // reference on every render.
  const error = React.useMemo<Error | null>(() => {
    const errorObj = metrics.error as (Error & { data?: { code?: string } }) | null;
    if (!errorObj || data) return null;
    switch (errorObj.data?.code) {
      case "PRECONDITION_FAILED":
        return new Error("Metrics are not configured. Set PROMETHEUS_URL on the server.");
      case "GATEWAY_TIMEOUT":
        return new Error("Metrics query timed out.");
      case "BAD_GATEWAY":
        return new Error("Cannot reach Prometheus. Check that the metrics service is running.");
      default:
        return new Error(errorObj.message);
    }
  }, [metrics.error, data]);

  // Everything derived from `data` is memoised on it: the page re-renders on
  // live K8s watch events far more often than the 30s metrics poll, and fresh
  // array/object references would defeat React.memo on every chart.
  const domain = React.useMemo<[number, number] | undefined>(() => (data ? [data.start, data.end] : undefined), [data]);

  const chartDataByTask = React.useMemo(() => {
    const map = new Map<string, Record<TaskMetricKey, MetricSeriesByApp[]>>();
    if (!data) return map;
    for (const { key } of TASK_CHART_DEFS) {
      for (const entry of data[key]) {
        const perTask = map.get(entry.task) ?? {
          cpu: EMPTY_CHART_DATA,
          memory: EMPTY_CHART_DATA,
          cpuThrottling: EMPTY_CHART_DATA,
        };
        perTask[key] = taskSeriesToChartData(entry);
        map.set(entry.task, perTask);
      }
    }
    return map;
  }, [data]);

  // Set of tasks with at least one sample in any metric — computed once per
  // data change instead of re-scanning all series in the render loop below.
  const tasksWithSamples = React.useMemo(() => {
    if (!data) return new Set<string>();
    return new Set(pods.filter(({ task }) => taskHasSamples(data, task)).map(({ task }) => task));
  }, [data, pods]);

  const summary = React.useMemo(
    () =>
      data
        ? {
            totalCpu: totalCpuSeconds(data.cpu, data.step),
            peakMemory: peakValue(data.memory),
            maxThrottling: peakValue(data.cpuThrottling),
          }
        : undefined,
    [data]
  );

  if (runIsLoading) {
    return <NoticeCard>Loading…</NoticeCard>;
  }

  if (startTime === undefined || pods.length === 0) {
    return <NoticeCard>No metrics available yet — no task pods have been recorded for this run.</NoticeCard>;
  }

  const isLoading = metrics.isLoading;
  // Refetch failed after at least one success: keep showing the last-known
  // data (keepPreviousData) but flag it as stale instead of silently
  // implying freshness.
  const isStale = data !== undefined && metrics.isError;
  const durationSeconds = (completionTime ?? data?.queriedAt ?? Math.floor(Date.now() / 1000)) - startTime;

  // Empty-state ladder for completed runs with zero samples anywhere:
  // a short run simply fell between Prometheus scrapes; a longer one has
  // aged past the retention window.
  if (!isInFlight && !isLoading && !error && data && isAllEmpty(data)) {
    return durationSeconds < MIN_SAMPLABLE_DURATION_SECONDS ? (
      <NoticeCard>
        This run completed too quickly to be sampled by Prometheus (metrics are scraped every 30–60 seconds).
      </NoticeCard>
    ) : (
      <NoticeCard>
        Metrics are no longer available for this run — it is older than the Prometheus retention window.
      </NoticeCard>
    );
  }

  const statDefs = [
    // Duration comes from the run itself, not the metrics query — never
    // loading and never affected by a metrics error.
    { title: "Duration", value: durationSeconds, format: formatDurationShort, suffix: "", static: true },
    { title: "Total CPU time", value: summary?.totalCpu ?? null, format: formatCpuSeconds, suffix: "" },
    { title: "Peak memory", value: summary?.peakMemory ?? null, format: formatMiB, suffix: "MiB" },
    { title: "Max CPU throttling", value: summary?.maxThrottling ?? null, format: formatPercent, suffix: "%" },
  ];

  return (
    <MetricsCursorProvider>
      <div className="space-y-6" data-tour={TOUR_PREFIX}>
        {isStale ? (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <AlertTriangle className="size-3.5" aria-label="Refresh failed" />
            Metrics may be stale — the last refresh failed
            {data ? ` (last updated ${new Date(data.queriedAt * 1000).toLocaleTimeString()})` : ""}
            {isInFlight ? "; retrying every 30 seconds." : "."}
          </div>
        ) : (
          isInFlight && (
            <div className="text-muted-foreground text-xs">Run in progress — metrics refresh every 30 seconds.</div>
          )
        )}

        {truncatedTaskCount > 0 && (
          <div className="text-muted-foreground text-xs">
            Showing the first {MAX_PIPELINE_RUN_PODS} of {MAX_PIPELINE_RUN_PODS + truncatedTaskCount} tasks — the
            metrics query is capped per request.
          </div>
        )}

        <Section title="Summary">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {statDefs.map(({ title, value, format, suffix, static: isStatic }) => (
              <StatPanel
                key={title}
                title={title}
                value={value}
                isLoading={isStatic ? false : isLoading}
                error={isStatic ? null : error}
                format={format}
                suffix={suffix}
                tourPrefix={TOUR_PREFIX}
              />
            ))}
          </div>
        </Section>

        {pods.map(({ task }) => {
          const noSamples = !isLoading && !error && data !== undefined && !tasksWithSamples.has(task);
          return (
            <Section key={task} title={`Task: ${task}`}>
              {noSamples ? (
                <Card className="p-4">
                  <div className="text-muted-foreground text-sm">
                    No samples for this task — it likely completed between Prometheus scrapes.
                  </div>
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {TASK_CHART_DEFS.map(({ key, label, unit }) => (
                    <MetricChart
                      key={key}
                      title={`${label} — ${task}`}
                      unit={unit}
                      data={chartDataByTask.get(task)?.[key] ?? EMPTY_CHART_DATA}
                      isLoading={isLoading}
                      error={error}
                      step={data?.step}
                      domain={domain}
                      tourPrefix={TOUR_PREFIX}
                    />
                  ))}
                </div>
              )}
            </Section>
          );
        })}
      </div>
    </MetricsCursorProvider>
  );
}
