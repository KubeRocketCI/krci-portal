/**
 * Shared severity color constants for Security module
 * Single source of truth for CRITICAL, HIGH, MEDIUM, LOW, UNKNOWN severity levels
 * Used across SCA (DependencyTrack), SAST (SonarQube), and Container Scanning (Trivy)
 *
 * Colors are aligned with Tailwind CSS color palette for consistency
 */

/**
 * Base color palette - hex values for charts and inline styles
 * These match Tailwind's default color palette
 */
const COLORS = {
  // Primary severity colors
  RED_600: "#DC2626", // Critical
  ORANGE_600: "#EA580C", // High
  AMBER_500: "#F59E0B", // Medium
  BLUE_500: "#3B82F6", // Low
  GRAY_500: "#6B7280", // Unknown/Unassigned

  // Background colors (for badges and cards)
  RED_100: "#FEE2E2",
  ORANGE_100: "#FFEDD5",
  AMBER_100: "#FEF3C7",
  BLUE_100: "#DBEAFE",
  GRAY_100: "#F3F4F6",

  // Status colors
  GREEN_500: "#22C55E", // Success
  GREEN_600: "#16A34A", // Success (darker)
} as const;

/**
 * Severity level hex colors for charts and inline styles
 * Use these when you need hex values (e.g., Recharts, inline styles)
 */
export const SEVERITY_COLORS = {
  CRITICAL: COLORS.RED_600,
  HIGH: COLORS.ORANGE_600,
  MEDIUM: COLORS.AMBER_500,
  LOW: COLORS.BLUE_500,
  UNKNOWN: COLORS.GRAY_500,
  UNASSIGNED: COLORS.GRAY_500, // Alias for SCA compatibility
} as const;

/**
 * Severity background hex colors for charts and inline styles
 */
export const SEVERITY_BG_COLORS = {
  CRITICAL: COLORS.RED_100,
  HIGH: COLORS.ORANGE_100,
  MEDIUM: COLORS.AMBER_100,
  LOW: COLORS.BLUE_100,
  UNKNOWN: COLORS.GRAY_100,
  UNASSIGNED: COLORS.GRAY_100,
} as const;

/**
 * Status colors for success/warning/error indicators
 */
export const STATUS_COLORS = {
  SUCCESS: COLORS.GREEN_500,
  WARNING: COLORS.AMBER_500,
  ERROR: COLORS.RED_600,
  INFO: COLORS.BLUE_500,
} as const;

/**
 * Tailwind CSS class combinations for severity badges
 * Includes proper dark mode support
 *
 * Note: INFO is treated as UNKNOWN (gray) in severity context.
 * This is intentional - "INFO" is sometimes used by security tools
 * as a low-priority/informational severity level, distinct from
 * STATUS_COLORS.INFO which is blue for general UI status indicators.
 */
export const SEVERITY_BADGE_CLASSES = {
  CRITICAL: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    combined: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  HIGH: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    combined: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  MEDIUM: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    combined: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  LOW: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    combined: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  UNKNOWN: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-700",
    combined: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  },
  UNASSIGNED: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-700",
    combined: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  },
  INFO: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-700",
    combined: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  },
} as const;

/**
 * Type definitions
 */
export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN" | "UNASSIGNED" | "INFO";

/**
 * Shared severity configuration for charts and tables.
 * Use this to ensure consistent ordering and labeling across components.
 */
export const SEVERITY_CONFIG = [
  { key: "critical", label: "Critical", level: "CRITICAL" as SeverityLevel, color: SEVERITY_COLORS.CRITICAL },
  { key: "high", label: "High", level: "HIGH" as SeverityLevel, color: SEVERITY_COLORS.HIGH },
  { key: "medium", label: "Medium", level: "MEDIUM" as SeverityLevel, color: SEVERITY_COLORS.MEDIUM },
  { key: "low", label: "Low", level: "LOW" as SeverityLevel, color: SEVERITY_COLORS.LOW },
  { key: "unknown", label: "Unknown", level: "UNKNOWN" as SeverityLevel, color: SEVERITY_COLORS.UNKNOWN },
] as const;

/**
 * Get severity hex color from severity level string
 * Handles case-insensitive input
 *
 * @param severity - Severity level (CRITICAL, HIGH, MEDIUM, LOW, UNKNOWN, UNASSIGNED)
 * @returns Hex color string
 *
 * @example
 * getSeverityColor("CRITICAL") // "#DC2626"
 * getSeverityColor("high") // "#EA580C"
 * getSeverityColor(undefined) // "#6B7280" (gray)
 */
export function getSeverityColor(severity: string | undefined): string {
  const upper = severity?.toUpperCase() as SeverityLevel | undefined;
  switch (upper) {
    case "CRITICAL":
      return SEVERITY_COLORS.CRITICAL;
    case "HIGH":
      return SEVERITY_COLORS.HIGH;
    case "MEDIUM":
      return SEVERITY_COLORS.MEDIUM;
    case "LOW":
      return SEVERITY_COLORS.LOW;
    case "INFO":
    case "UNKNOWN":
    case "UNASSIGNED":
    default:
      return SEVERITY_COLORS.UNKNOWN;
  }
}

/**
 * Get severity background hex color from severity level string
 * Handles case-insensitive input
 *
 * @param severity - Severity level
 * @returns Background hex color string
 */
export function getSeverityBgColor(severity: string | undefined): string {
  const upper = severity?.toUpperCase() as SeverityLevel | undefined;
  switch (upper) {
    case "CRITICAL":
      return SEVERITY_BG_COLORS.CRITICAL;
    case "HIGH":
      return SEVERITY_BG_COLORS.HIGH;
    case "MEDIUM":
      return SEVERITY_BG_COLORS.MEDIUM;
    case "LOW":
      return SEVERITY_BG_COLORS.LOW;
    case "INFO":
    case "UNKNOWN":
    case "UNASSIGNED":
    default:
      return SEVERITY_BG_COLORS.UNKNOWN;
  }
}

/**
 * Get Tailwind CSS classes for severity badge
 * Handles case-insensitive input
 *
 * @param severity - Severity level
 * @returns Object with Tailwind class strings for bg, text, border, and combined
 */
export function getSeverityBadgeClasses(severity: string | undefined): (typeof SEVERITY_BADGE_CLASSES)[SeverityLevel] {
  const upper = severity?.toUpperCase() as SeverityLevel | undefined;
  switch (upper) {
    case "CRITICAL":
      return SEVERITY_BADGE_CLASSES.CRITICAL;
    case "HIGH":
      return SEVERITY_BADGE_CLASSES.HIGH;
    case "MEDIUM":
      return SEVERITY_BADGE_CLASSES.MEDIUM;
    case "LOW":
      return SEVERITY_BADGE_CLASSES.LOW;
    case "INFO":
    case "UNKNOWN":
    case "UNASSIGNED":
    default:
      return SEVERITY_BADGE_CLASSES.UNKNOWN;
  }
}

/**
 * CVSS score text color classes (Tailwind) based on CVSS 3.x severity ranges
 * - Critical: 9.0 - 10.0
 * - High: 7.0 - 8.9
 * - Medium: 4.0 - 6.9
 * - Low: 0.1 - 3.9
 * - None: 0.0
 */
export const CVSS_SCORE_TEXT_CLASSES = {
  CRITICAL: "text-red-600 dark:text-red-400",
  HIGH: "text-orange-600 dark:text-orange-400",
  MEDIUM: "text-amber-600 dark:text-amber-400",
  LOW: "text-blue-600 dark:text-blue-400",
  NONE: "text-gray-500 dark:text-gray-400",
} as const;

/**
 * Get Tailwind text color class for CVSS score
 * Based on CVSS 3.x severity rating scale
 *
 * @param score - CVSS score (0.0 - 10.0)
 * @returns Tailwind text color class string
 *
 * @example
 * getCvssScoreColorClass(9.5) // "text-red-600 dark:text-red-400"
 * getCvssScoreColorClass(7.2) // "text-orange-600 dark:text-orange-400"
 * getCvssScoreColorClass(5.0) // "text-amber-600 dark:text-amber-400"
 * getCvssScoreColorClass(2.1) // "text-blue-600 dark:text-blue-400"
 */
export function getCvssScoreColorClass(score: number | undefined | null): string {
  if (score === undefined || score === null) return CVSS_SCORE_TEXT_CLASSES.NONE;
  if (score >= 9.0) return CVSS_SCORE_TEXT_CLASSES.CRITICAL;
  if (score >= 7.0) return CVSS_SCORE_TEXT_CLASSES.HIGH;
  if (score >= 4.0) return CVSS_SCORE_TEXT_CLASSES.MEDIUM;
  if (score > 0) return CVSS_SCORE_TEXT_CLASSES.LOW;
  return CVSS_SCORE_TEXT_CLASSES.NONE;
}
