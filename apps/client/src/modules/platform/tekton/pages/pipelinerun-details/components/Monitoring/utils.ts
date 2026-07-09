import type { MetricSeriesByApp, PipelineRunMetricsOutput, TaskMetricSeries } from "@my-project/shared";
import { humanize, HUMANIZE_DURATION_OPTIONS } from "@/core/utils/date-humanize";
import type { PipelineRunTaskData } from "../../hooks/types";

export interface TaskPodRef {
  podName: string;
  task: string;
}

/**
 * Pad the queried window by one scrape interval on each side so the first and
 * last samples of a run aren't clipped by scrape timing.
 */
export const WINDOW_PADDING_SECONDS = 60;

/**
 * Runs shorter than this that return no samples at all are reported as "too
 * short to sample" (Prometheus scrapes every 30–60s) rather than as aged out
 * of retention.
 */
export const MIN_SAMPLABLE_DURATION_SECONDS = 120;

/**
 * Collect `{podName, task}` refs in pipeline-task execution order. Tasks
 * without a TaskRun pod (not started yet, approval gates, history records
 * missing status) are skipped. Works for both live and history sources —
 * `TaskRun.status.podName` is present in K8s watches and Tekton Results
 * records alike.
 */
export function collectTaskPods(tasksByName: Map<string, PipelineRunTaskData>): TaskPodRef[] {
  const out: TaskPodRef[] = [];
  for (const [taskName, data] of tasksByName) {
    const podName = data.taskRun?.status?.podName;
    if (podName) out.push({ podName, task: taskName });
  }
  return out;
}

export function toUnixSeconds(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? undefined : Math.floor(ms / 1000);
}

/**
 * Adapt one task's per-step series to the MetricChart data shape: the task is
 * the group and each step is a line.
 */
export function taskSeriesToChartData(entry: TaskMetricSeries | undefined): MetricSeriesByApp[] {
  if (!entry) return [];
  return [{ app: entry.task, pods: entry.steps.map((s) => ({ pod: s.step, series: s.series })) }];
}

function hasSamples(entries: TaskMetricSeries[]): boolean {
  return entries.some((entry) => entry.steps.some((step) => step.series.length > 0));
}

/** True when Prometheus returned no samples for any metric of any task. */
export function isAllEmpty(data: PipelineRunMetricsOutput): boolean {
  return !hasSamples(data.cpu) && !hasSamples(data.memory) && !hasSamples(data.cpuThrottling);
}

/** True when a specific task has at least one sample in any metric. */
export function taskHasSamples(data: PipelineRunMetricsOutput, task: string): boolean {
  return [data.cpu, data.memory, data.cpuThrottling].some((metric) =>
    hasSamples(metric.filter((entry) => entry.task === task))
  );
}

/**
 * Approximate total CPU time consumed across all tasks and steps by
 * integrating the rate series: each datapoint is `cores` sustained for one
 * `step` interval. Returns null when there are no samples.
 */
export function totalCpuSeconds(cpu: TaskMetricSeries[], stepSeconds: number): number | null {
  let total = 0;
  let hasAny = false;
  for (const entry of cpu) {
    for (const step of entry.steps) {
      for (const point of step.series) {
        total += point.v * stepSeconds;
        hasAny = true;
      }
    }
  }
  return hasAny ? total : null;
}

/** Max sample across all tasks/steps of a metric, or null when empty. */
export function peakValue(entries: TaskMetricSeries[]): number | null {
  let max: number | null = null;
  for (const entry of entries) {
    for (const step of entry.steps) {
      for (const point of step.series) {
        if (max === null || point.v > max) max = point.v;
      }
    }
  }
  return max;
}

/** Compact duration ("45s", "3m 24s", "1h 2m") via the app-wide humanizer. */
export function formatDurationShort(totalSeconds: number): string {
  return humanize(Math.max(0, totalSeconds) * 1000, HUMANIZE_DURATION_OPTIONS);
}

/** Compact CPU time: "12.5s", "3m 24s" (sub-minute keeps one decimal). */
export function formatCpuSeconds(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}s`;
  return formatDurationShort(totalSeconds);
}
