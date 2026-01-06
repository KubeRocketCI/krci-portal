/**
 * SonarQube SAST Module - Metric Utilities
 * Metric parsing, formatting, and quality assessment
 */

import { COVERAGE_THRESHOLDS, DUPLICATION_THRESHOLDS, COVERAGE_COLORS } from "../constants";

/**
 * Parse percentage value from string
 *
 * @param value - Percentage as string (e.g., "75.5", "80")
 * @returns Parsed number rounded to 1 decimal place, or 0 if invalid
 *
 * @example
 * parsePercentage("75.5") // 75.5
 * parsePercentage("invalid") // 0
 * parsePercentage(undefined) // 0
 */
export const parsePercentage = (value?: string): number => {
  if (!value) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : Math.round(num * 10) / 10; // Round to 1 decimal
};

/**
 * Parse count value from string
 *
 * @param value - Count as string (e.g., "5", "100")
 * @returns Parsed integer, or 0 if invalid
 *
 * @example
 * parseCount("42") // 42
 * parseCount("invalid") // 0
 * parseCount(undefined) // 0
 */
export const parseCount = (value?: string): number => {
  if (!value) return 0;
  const num = parseInt(value, 10);
  return isNaN(num) ? 0 : num;
};

/**
 * Get color class for coverage percentage based on quality thresholds
 *
 * @param percentage - Coverage percentage (0-100)
 * @returns CSS text color class
 *
 * @example
 * getCoverageColorClass(85) // "text-green-600 dark:text-green-400" (excellent)
 * getCoverageColorClass(65) // "text-yellow-600 dark:text-yellow-400" (good)
 * getCoverageColorClass(35) // "text-red-600 dark:text-red-400" (poor)
 */
export const getCoverageColorClass = (percentage: number): string => {
  if (percentage >= COVERAGE_THRESHOLDS.EXCELLENT) return COVERAGE_COLORS.EXCELLENT;
  if (percentage >= COVERAGE_THRESHOLDS.GOOD) return COVERAGE_COLORS.GOOD;
  if (percentage >= COVERAGE_THRESHOLDS.FAIR) return COVERAGE_COLORS.FAIR;
  return COVERAGE_COLORS.POOR;
};

/**
 * Determine if coverage meets good quality threshold
 *
 * @param percentage - Coverage percentage (0-100)
 * @returns True if coverage >= 60% (GOOD threshold)
 *
 * @example
 * isCoverageGood(75) // true
 * isCoverageGood(55) // false
 */
export const isCoverageGood = (percentage: number): boolean => {
  return percentage >= COVERAGE_THRESHOLDS.GOOD;
};

/**
 * Determine if duplication is within acceptable range
 *
 * @param percentage - Duplication percentage (0-100)
 * @returns True if duplication <= 5% (EXCELLENT threshold)
 *
 * @example
 * isDuplicationGood(3) // true
 * isDuplicationGood(8) // false
 */
export const isDuplicationGood = (percentage: number): boolean => {
  return percentage <= DUPLICATION_THRESHOLDS.EXCELLENT;
};

/**
 * Format percentage for display
 *
 * @param value - Percentage value
 * @returns Formatted string with % symbol
 *
 * @example
 * formatPercentage(75.5) // "75.5%"
 * formatPercentage(0) // "0%"
 */
export const formatPercentage = (value: number): string => {
  return `${value}%`;
};

/**
 * Format count for display with commas
 *
 * @param value - Count value
 * @returns Formatted string with thousand separators
 *
 * @example
 * formatCount(1234) // "1,234"
 * formatCount(42) // "42"
 */
export const formatCount = (value: number): string => {
  return value.toLocaleString("en-US");
};
