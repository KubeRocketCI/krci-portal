/**
 * Color constants for SCA dashboard
 * Consolidated to avoid duplication - single source of truth for each color
 */

// Base color palette
const COLORS = {
  RED_600: "#DC2626",
  ORANGE_600: "#EA580C",
  AMBER_500: "#F59E0B",
  BLUE_500: "#3B82F6",
  GRAY_500: "#6B7280",
  GRAY_600: "#888888",
  GREEN_500: "#10B981",
  PURPLE_500: "#A66BF8",
  // Background colors
  RED_100: "#FEE2E2",
  ORANGE_100: "#FFEDD5",
  AMBER_100: "#FEF3C7",
  BLUE_100: "#DBEAFE",
  GRAY_100: "#F3F4F6",
} as const;

// Severity level colors
export const SEVERITY_COLORS = {
  CRITICAL: COLORS.RED_600,
  HIGH: COLORS.ORANGE_600,
  MEDIUM: COLORS.AMBER_500,
  LOW: COLORS.BLUE_500,
  UNASSIGNED: COLORS.GRAY_500,
} as const;

// Policy violation colors
export const VIOLATION_COLORS = {
  FAIL: COLORS.RED_600,
  WARN: COLORS.AMBER_500,
  INFO: COLORS.BLUE_500,
  SECURITY: COLORS.RED_600,
  LICENSE: COLORS.AMBER_500,
  OPERATIONAL: COLORS.BLUE_500,
} as const;

// Status colors
export const STATUS_COLORS = {
  PASSED: COLORS.GREEN_500,
  FAILED: COLORS.RED_600,
  WARNING: COLORS.AMBER_500,
  AUDITED: COLORS.GREEN_500,
  UNAUDITED: COLORS.GRAY_500,
} as const;

// Variant colors for generic UI elements
export const VARIANT_COLORS = {
  INFO: COLORS.BLUE_500,
  DANGER: COLORS.RED_600,
  WARNING: COLORS.AMBER_500,
} as const;

// Chart-specific colors
export const CHART_COLORS = {
  AXIS_STROKE: COLORS.GRAY_600,
  TOTAL_LINE: COLORS.GRAY_500,
} as const;

// Chart fill opacity (for area charts)
export const CHART_FILL_OPACITY = "40" as const;

// Background colors for severity cards
export const SEVERITY_BG_COLORS = {
  CRITICAL: COLORS.RED_100,
  HIGH: COLORS.ORANGE_100,
  MEDIUM: COLORS.AMBER_100,
  LOW: COLORS.BLUE_100,
  UNASSIGNED: COLORS.GRAY_100,
} as const;

// Risk score colors (informational/neutral)
export const RISK_SCORE_COLORS = {
  BORDER: COLORS.BLUE_500,
  BACKGROUND: COLORS.BLUE_100,
} as const;

// CVSS score range colors (0-10 scale)
export const CVSS_COLORS = {
  CRITICAL: COLORS.RED_600, // 9.0-10.0
  HIGH: COLORS.ORANGE_600, // 7.0-8.9
  MEDIUM: COLORS.AMBER_500, // 4.0-6.9
  LOW: COLORS.BLUE_500, // 0.1-3.9
  NONE: COLORS.GRAY_500, // 0.0
} as const;

// EPSS chart colors
export const EPSS_COLORS = {
  SCATTER_POINT: COLORS.PURPLE_500,
} as const;

// Type exports
export type SeverityColor = (typeof SEVERITY_COLORS)[keyof typeof SEVERITY_COLORS];
export type ViolationColor = (typeof VIOLATION_COLORS)[keyof typeof VIOLATION_COLORS];
export type StatusColor = (typeof STATUS_COLORS)[keyof typeof STATUS_COLORS];
export type VariantColor = (typeof VARIANT_COLORS)[keyof typeof VARIANT_COLORS];
export type CvssColor = (typeof CVSS_COLORS)[keyof typeof CVSS_COLORS];

// Severity level type
export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO" | "UNASSIGNED";

/**
 * Get severity color from severity level string
 * @param severity - Severity level (CRITICAL, HIGH, MEDIUM, LOW, INFO, UNASSIGNED)
 * @returns Color hex string
 */
export function getSeverityColor(severity: string | undefined): string {
  switch (severity) {
    case "CRITICAL":
      return SEVERITY_COLORS.CRITICAL;
    case "HIGH":
      return SEVERITY_COLORS.HIGH;
    case "MEDIUM":
      return SEVERITY_COLORS.MEDIUM;
    case "LOW":
      return SEVERITY_COLORS.LOW;
    case "INFO":
    case "UNASSIGNED":
    default:
      return SEVERITY_COLORS.UNASSIGNED;
  }
}
