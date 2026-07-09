import {
  PIPELINE_RUN_METRICS_MAX_POINTS,
  PIPELINE_RUN_STEP_CHOICES,
  sortByName,
  type PromQLMatrixResponse,
  type TaskMetricSeries,
} from "@my-project/shared";

import { buildRegexAlternation, matrixValuesToPoints } from "../getDeploymentMetrics/utils.js";

/**
 * Smallest allowed step that keeps the series at or under
 * PIPELINE_RUN_METRICS_MAX_POINTS datapoints. A short build gets 15s
 * resolution; a multi-hour pipeline degrades gracefully instead of
 * shipping thousands of points per step container.
 */
export function derivePipelineRunStep(windowSeconds: number): number {
  for (const step of PIPELINE_RUN_STEP_CHOICES) {
    if (windowSeconds / step <= PIPELINE_RUN_METRICS_MAX_POINTS) return step;
  }
  return PIPELINE_RUN_STEP_CHOICES[PIPELINE_RUN_STEP_CHOICES.length - 1];
}

/**
 * Rate window scaled to the resolution step. Floors at 120s (≥ 2 samples at
 * the common 30–60s scrape interval) rather than the 5m floor used for
 * long-lived deployment pods — TaskRun pods often live only a few minutes,
 * and a 5m window would smear short tasks into invisibility.
 */
export function derivePipelineRunRateWindow(stepSeconds: number): string {
  return `${Math.max(4 * stepSeconds, 120)}s`;
}

export const PIPELINE_RUN_METRIC_KEYS = ["cpu", "memory", "cpuThrottledPeriods", "cpuPeriods"] as const;

export type PipelineRunMetricKey = (typeof PIPELINE_RUN_METRIC_KEYS)[number];

/**
 * Build the range-query PromQL strings for a fixed set of TaskRun pods.
 * Only Tekton step containers (`step-*`) are selected — init containers
 * (prepare, place-scripts) and sidecars are excluded so each line maps 1:1
 * to a user-authored step.
 *
 * `namespace` and `podNames` are RFC-1123-validated by Zod at the tRPC
 * boundary; `podNames` are additionally regex-escaped here.
 *
 * Precondition: `podNames` must be non-empty.
 */
export function buildPipelineRunPromQLQueries({
  namespace,
  podNames,
  lookbackWindow,
}: {
  namespace: string;
  podNames: string[];
  lookbackWindow: string;
}): Record<PipelineRunMetricKey, string> {
  const sel = `namespace="${namespace}", pod=~"${buildRegexAlternation(podNames)}", container=~"^step-.*"`;
  const wrap = (inner: string): string => `sum by (pod, container) (${inner})`;

  return {
    cpu: wrap(`rate(container_cpu_usage_seconds_total{${sel}}[${lookbackWindow}])`),
    memory: wrap(`container_memory_working_set_bytes{${sel}}`),
    cpuThrottledPeriods: wrap(`rate(container_cpu_cfs_throttled_periods_total{${sel}}[${lookbackWindow}])`),
    cpuPeriods: wrap(`rate(container_cpu_cfs_periods_total{${sel}}[${lookbackWindow}])`),
  };
}

const STEP_CONTAINER_PREFIX = "step-";

/**
 * Convert a Prometheus matrix (series labelled `pod` + `container`) into
 * per-task, per-step series. Output preserves the order of `pods` (the
 * client sends pipeline-task execution order) and includes every requested
 * task even when Prometheus returned no samples for it — the client relies
 * on that to render per-task "no data" states. Steps within a task are
 * sorted by name — first-appearance order would depend on which step's
 * earliest sample lands first and can flip between auto-refreshes, making
 * chart line colors swap — and carry the `step-` container prefix stripped.
 */
export function matrixToTaskSeries(
  matrix: PromQLMatrixResponse,
  pods: Array<{ podName: string; task: string }>
): TaskMetricSeries[] {
  const stepsByPod = new Map<string, Map<string, TaskMetricSeries["steps"][number]["series"]>>();
  for (const { podName } of pods) stepsByPod.set(podName, new Map());

  for (const row of matrix.data.result) {
    const podName = row.metric.pod;
    const container = row.metric.container;
    if (!podName || !container) continue;
    const stepMap = stepsByPod.get(podName);
    if (!stepMap) continue;
    const step = container.startsWith(STEP_CONTAINER_PREFIX)
      ? container.slice(STEP_CONTAINER_PREFIX.length)
      : container;
    // `sum by (pod, container)` guarantees one row per (pod, container)
    // tuple, so last-write-wins is safe.
    stepMap.set(step, matrixValuesToPoints(row.values));
  }

  return pods.map(({ podName, task }) => {
    const stepMap = stepsByPod.get(podName)!;
    return {
      task,
      pod: podName,
      steps: [...stepMap.keys()].sort(sortByName).map((step) => ({ step, series: stepMap.get(step)! })),
    };
  });
}

/**
 * Combine throttled-periods and total-periods series into a per-step
 * throttling percentage (`100 * throttled / total`). Points are emitted only
 * where both sides have a finite value and the denominator is strictly
 * positive; steps missing from the denominator emit empty series.
 */
export function combineTaskRatioSeries(
  numerator: TaskMetricSeries[],
  denominator: TaskMetricSeries[]
): TaskMetricSeries[] {
  const denByPod = new Map<string, Map<string, Map<number, number>>>();
  for (const entry of denominator) {
    const stepMap = new Map<string, Map<number, number>>();
    for (const step of entry.steps) {
      const points = new Map<number, number>();
      for (const p of step.series) points.set(p.t, p.v);
      stepMap.set(step.step, points);
    }
    denByPod.set(entry.pod, stepMap);
  }

  return numerator.map(({ task, pod, steps }) => {
    const denSteps = denByPod.get(pod);
    return {
      task,
      pod,
      steps: steps.map(({ step, series }) => {
        const denPoints = denSteps?.get(step);
        if (!denPoints || denPoints.size === 0) return { step, series: [] };
        const out: { t: number; v: number }[] = [];
        for (const { t, v } of series) {
          const den = denPoints.get(t);
          if (den === undefined) continue;
          if (!Number.isFinite(v) || !Number.isFinite(den) || den <= 0) continue;
          out.push({ t, v: (100 * v) / den });
        }
        return { step, series: out };
      }),
    };
  });
}
