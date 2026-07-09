export const METRIC_RANGE_VALUES = ["5m", "15m", "1h", "6h", "24h"] as const;

export const PROMETHEUS_TIME_RANGES = {
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "6h": 21600,
  "24h": 86400,
} as const;

// Step chosen so payload size stays bounded across all ranges.
export const STEP_BY_RANGE = {
  "5m": 15,
  "15m": 30,
  "1h": 30,
  "6h": 120,
  "24h": 300,
} as const;

export const MAX_APPLICATIONS = 50;

/** Upper bound on TaskRun pods accepted by getPipelineRunMetrics. */
export const MAX_PIPELINE_RUN_PODS = 50;

/**
 * Upper bound on the queried window for getPipelineRunMetrics. Matches the
 * longest Prometheus retention we target; anything older has no samples
 * anyway, and an unbounded window would let a client request an arbitrarily
 * expensive range query.
 */
export const MAX_PIPELINE_RUN_WINDOW_SECONDS = 7 * 86_400;

/**
 * Target datapoint count per series for PipelineRun metrics. The query step
 * is derived from the run window to stay at or under this, bounding payload
 * size for long-running pipelines.
 */
export const PIPELINE_RUN_METRICS_MAX_POINTS = 300;

/** Allowed query_range steps (seconds) for PipelineRun metrics, ascending. */
export const PIPELINE_RUN_STEP_CHOICES = [15, 30, 60, 120, 300, 600, 1800, 3600] as const;

export const PROMETHEUS_TIMEOUT_MS = 10_000;

/**
 * Prometheus label name emitted by `kube-state-metrics` for the
 * `app.kubernetes.io/instance` Kubernetes label, after KSM's
 * `label_` prefix and `_`-for-`/`/`.` munging. Used as the join
 * key for vector matching pod metrics with `kube_pod_labels`.
 */
export const POD_LABEL_APP_INSTANCE = "label_app_kubernetes_io_instance";
