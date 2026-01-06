/**
 * SonarQube SAST Module - Color Constants
 * Single source of truth for all rating and status colors
 * Aligned with SCA color palette for consistency across Security module
 */

/**
 * Base color palette (aligned with SCA)
 * These hex values correspond to Tailwind's default color palette
 * and match the colors used in the SCA (Dependency Track) module
 */
const BASE_COLORS = {
  // Primary rating colors (matching SCA severity colors)
  GREEN_500: "#10B981", // A rating - passed/excellent (matches SCA PASSED)
  LIME_500: "#84CC16", // B rating - good with minor issues
  AMBER_500: "#F59E0B", // C rating - warning/major issues (matches SCA MEDIUM/WARN)
  ORANGE_600: "#EA580C", // D rating - critical issues (matches SCA HIGH)
  RED_600: "#DC2626", // E rating - blocker/failed (matches SCA CRITICAL/FAIL)
  GRAY_500: "#6B7280", // No rating/data (matches SCA UNASSIGNED)

  // Background colors (for badges and cards)
  GREEN_100: "#D1FAE5",
  LIME_100: "#ECFCCB",
  AMBER_100: "#FEF3C7",
  ORANGE_100: "#FFEDD5",
  RED_100: "#FEE2E2",
  GRAY_100: "#F3F4F6",
} as const;

/**
 * Rating colors for A-E scale (SonarQube 1.0-5.0 ratings)
 * Used for reliability, security, maintainability ratings
 *
 * Mapping from SonarQube ratings:
 * - A (1.0): Best - 0 issues or ≥ 0 info issues
 * - B (2.0): Good - ≥ 1 minor issue
 * - C (3.0): Warning - ≥ 1 major issue
 * - D (4.0): Critical - ≥ 1 critical issue
 * - E (5.0): Blocker - ≥ 1 blocker issue
 */
export const RATING_COLORS = {
  A: {
    hex: BASE_COLORS.GREEN_500,
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
    combined: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  B: {
    hex: BASE_COLORS.LIME_500,
    bg: "bg-lime-100 dark:bg-lime-900/30",
    text: "text-lime-700 dark:text-lime-400",
    border: "border-lime-200 dark:border-lime-800",
    combined: "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400",
  },
  C: {
    hex: BASE_COLORS.AMBER_500,
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    border: "border-yellow-200 dark:border-yellow-800",
    combined: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  D: {
    hex: BASE_COLORS.ORANGE_600,
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    combined: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  E: {
    hex: BASE_COLORS.RED_600,
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    combined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  NONE: {
    hex: BASE_COLORS.GRAY_500,
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-700",
    combined: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
  },
} as const;

/**
 * Quality Gate status colors (maps to rating colors for consistency)
 */
export const QUALITY_GATE_COLORS = {
  OK: RATING_COLORS.A, // Green - passed
  WARN: RATING_COLORS.C, // Yellow - warning
  ERROR: RATING_COLORS.E, // Red - failed
  NONE: RATING_COLORS.NONE, // Gray - no data
} as const;

/**
 * Coverage percentage colors (for text display)
 */
export const COVERAGE_COLORS = {
  EXCELLENT: "text-green-600 dark:text-green-400", // >= 80%
  GOOD: "text-yellow-600 dark:text-yellow-400", // >= 60%
  FAIR: "text-orange-600 dark:text-orange-400", // >= 40%
  POOR: "text-red-600 dark:text-red-400", // < 40%
} as const;

/**
 * Indicator dot colors (for simple good/bad indicators)
 */
export const INDICATOR_COLORS = {
  GOOD: "bg-green-500",
  WARNING: "bg-yellow-500",
  ERROR: "bg-red-500",
} as const;

/**
 * Get hex color for a rating letter grade
 * Useful for charts and visualizations that require hex values
 *
 * @param rating - Letter grade (A-E) or undefined
 * @returns Hex color string (e.g., "#10B981")
 *
 * @example
 * getRatingHexColor("A") // "#10B981" (green)
 * getRatingHexColor("E") // "#DC2626" (red)
 * getRatingHexColor(undefined) // "#6B7280" (gray)
 */
export const getRatingHexColor = (rating?: string): string => {
  if (!rating) return RATING_COLORS.NONE.hex;
  const upper = rating.toUpperCase() as keyof typeof RATING_COLORS;
  return RATING_COLORS[upper]?.hex || RATING_COLORS.NONE.hex;
};

/**
 * Type exports for type safety
 */
export type RatingGrade = "A" | "B" | "C" | "D" | "E" | "NONE";
export type RatingColor = (typeof RATING_COLORS)[RatingGrade];
