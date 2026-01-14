/**
 * SonarQube API Constants
 */

export const SONARQUBE_API_VERSION = "v1";
export const DEFAULT_PAGE_SIZE = 50;
export const DEFAULT_TIMEOUT_MS = 30_000; // 30 seconds

/**
 * Metric keys to fetch for project overview
 */
export const SONARQUBE_METRIC_KEYS = [
  "bugs",
  "vulnerabilities",
  "code_smells",
  "coverage",
  "duplicated_lines_density",
  "ncloc",
  "reliability_rating",
  "security_rating",
  "sqale_rating",
  "alert_status",
  "security_hotspots",
  "security_hotspots_reviewed",
  "security_review_rating",
] as const;

export type SonarQubeMetricKey = (typeof SONARQUBE_METRIC_KEYS)[number];

/**
 * Quality Gate status values
 */
export const QUALITY_GATE_STATUS = {
  OK: "OK",
  WARN: "WARN",
  ERROR: "ERROR",
  NONE: "NONE",
} as const;

export type QualityGateStatusValue = (typeof QUALITY_GATE_STATUS)[keyof typeof QUALITY_GATE_STATUS];

/**
 * Rating values (1.0 = A, 2.0 = B, 3.0 = C, 4.0 = D, 5.0 = E)
 */
export const RATING_VALUES = ["1.0", "2.0", "3.0", "4.0", "5.0"] as const;
export type RatingValue = (typeof RATING_VALUES)[number];

/**
 * Issue severity levels (descending order of priority)
 */
export const ISSUE_SEVERITIES = ["BLOCKER", "CRITICAL", "MAJOR", "MINOR", "INFO"] as const;

/**
 * Issue types
 */
export const ISSUE_TYPES = ["BUG", "VULNERABILITY", "CODE_SMELL"] as const;

/**
 * Issue statuses
 */
export const ISSUE_STATUSES = ["OPEN", "CONFIRMED", "REOPENED", "RESOLVED", "CLOSED"] as const;
