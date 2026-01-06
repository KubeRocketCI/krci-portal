/**
 * SonarQube SAST Module - Rating Utilities
 * Consolidated rating conversion and color logic
 * Aligned with SCA module for consistency across Security features
 */

import { RATING_COLORS, RATING_THRESHOLDS, getRatingHexColor } from "../constants";

/**
 * Convert SonarQube numeric rating (1.0-5.0) to letter grade (A-E)
 *
 * @param rating - Numeric rating as string (e.g., "1.0", "3.5")
 * @returns Letter grade (A-E) or undefined if invalid
 *
 * @example
 * getRatingLabel("1.0") // "A"
 * getRatingLabel("3.2") // "D"
 * getRatingLabel(undefined) // undefined
 */
export const getRatingLabel = (rating?: string): string | undefined => {
  if (!rating) return undefined;
  const num = parseFloat(rating);
  if (isNaN(num)) return undefined;

  if (num <= RATING_THRESHOLDS.A.max) return "A";
  if (num <= RATING_THRESHOLDS.B.max) return "B";
  if (num <= RATING_THRESHOLDS.C.max) return "C";
  if (num <= RATING_THRESHOLDS.D.max) return "D";
  return "E";
};

/**
 * Get all color classes for a rating letter grade
 *
 * @param rating - Letter grade (A-E) or undefined
 * @returns Object with bg, text, border, and combined color classes
 *
 * @example
 * getRatingColors("A") // { bg: "bg-green-100...", text: "text-green-700...", ... }
 */
export const getRatingColors = (rating?: string) => {
  if (!rating) return RATING_COLORS.NONE;
  const upper = rating.toUpperCase() as keyof typeof RATING_COLORS;
  return RATING_COLORS[upper] || RATING_COLORS.NONE;
};

/**
 * Get combined background + text color classes for a rating
 * Useful for Badge components with outline variant
 *
 * @param rating - Letter grade (A-E) or undefined
 * @returns Combined CSS class string
 *
 * @example
 * getRatingColorClass("A") // "bg-green-100 text-green-800 dark:bg-green-900/30..."
 */
export const getRatingColorClass = (rating?: string): string => {
  return getRatingColors(rating).combined;
};

/**
 * Get background color class for a rating
 *
 * @param rating - Letter grade (A-E) or undefined
 * @returns Background CSS class string
 */
export const getRatingBgClass = (rating?: string): string => {
  return getRatingColors(rating).bg;
};

/**
 * Get text color class for a rating
 *
 * @param rating - Letter grade (A-E) or undefined
 * @returns Text CSS class string
 */
export const getRatingTextClass = (rating?: string): string => {
  return getRatingColors(rating).text;
};

/**
 * Get border color class for a rating
 *
 * @param rating - Letter grade (A-E) or undefined
 * @returns Border CSS class string
 */
export const getRatingBorderClass = (rating?: string): string => {
  return getRatingColors(rating).border;
};

/**
 * Get hex color for a rating (useful for charts and visualizations)
 * Re-exported from constants for convenience
 *
 * @param rating - Letter grade (A-E) or undefined
 * @returns Hex color string (e.g., "#10B981")
 */
export { getRatingHexColor };
