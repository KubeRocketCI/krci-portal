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

export const PROMETHEUS_TIMEOUT_MS = 10_000;
