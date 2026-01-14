import { ValueOf } from "@/core/types/global";

/**
 * SonarQube SAST Module - Metric Constants
 * Canonical mappings for SonarQube metric keys, operators, and issue types
 */

/**
 * SonarQube metric key mappings to human-readable names
 * Used across quality gates, metric displays, and issue categorization
 *
 * Reference: https://docs.sonarqube.org/latest/user-guide/metric-definitions/
 */
export const SONARQUBE_METRIC_NAMES: Record<string, string> = {
  // New code metrics (Quality Gate focus)
  new_reliability_rating: "New Reliability Rating",
  new_security_rating: "New Security Rating",
  new_maintainability_rating: "New Maintainability Rating",
  new_coverage: "New Coverage",
  new_duplicated_lines_density: "New Duplicated Lines",
  new_security_hotspots_reviewed: "New Security Hotspots Reviewed",

  // Overall code metrics
  reliability_rating: "Reliability Rating",
  security_rating: "Security Rating",
  sqale_rating: "Maintainability Rating",
  coverage: "Coverage",
  duplicated_lines_density: "Duplicated Lines",
  security_hotspots_reviewed: "Security Hotspots Reviewed",
};

/**
 * SonarQube comparison operator symbols
 * Used in quality gate conditions and metric comparisons
 *
 * Reference: SonarQube API uses these operator codes for condition evaluation
 */
export const SONARQUBE_OPERATORS: Record<string, string> = {
  GT: ">", // Greater than
  LT: "<", // Less than
  EQ: "=", // Equal
  NE: "≠", // Not equal
  GE: "≥", // Greater or equal
  LE: "≤", // Less or equal
};

/**
 * SonarQube issue type constants
 * Represents the three main categories of issues in SonarQube analysis
 *
 * Reference: https://docs.sonarqube.org/latest/user-guide/issues/
 */
export const SONARQUBE_ISSUE_TYPES = {
  ALL: "ALL",
  BUG: "BUG",
  VULNERABILITY: "VULNERABILITY",
  CODE_SMELL: "CODE_SMELL",
} as const;

export type SonarQubeIssueType = ValueOf<typeof SONARQUBE_ISSUE_TYPES>;
