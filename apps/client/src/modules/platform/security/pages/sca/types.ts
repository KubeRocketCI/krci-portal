import { PortfolioMetrics } from "@my-project/shared";

/**
 * Common props for components that display portfolio metrics data
 */
export interface MetricsDisplayProps {
  metrics: PortfolioMetrics[] | undefined;
  isLoading?: boolean;
}

/**
 * Data point for sparkline and trend charts
 */
export interface ChartDataPoint {
  value: number;
  timestamp?: number;
}

/**
 * Severity level types used across SCA components
 */
export type SeverityLevel = "critical" | "high" | "medium" | "low" | "unassigned";

/**
 * Violation state types
 */
export type ViolationState = "FAIL" | "WARN" | "INFO";

/**
 * Policy violation type classification
 */
export type ViolationType = "LICENSE" | "OPERATIONAL" | "SECURITY";
