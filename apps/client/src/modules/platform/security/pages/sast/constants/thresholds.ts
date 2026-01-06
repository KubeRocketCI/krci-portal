/**
 * SonarQube SAST Module - Threshold Constants
 * Business logic values for metric categorization
 *
 * Reference: SonarQube rating system maps numeric values (1.0-5.0) to letter grades (A-E)
 * based on issue severity counts in the codebase.
 */

/**
 * SonarQube rating thresholds (1.0-5.0 numeric scale to A-E letter grades)
 *
 * Rating Meanings (from SonarQube):
 * - A (1.0): Best quality - 0 issues or ≥ 0 info issues only
 * - B (2.0): Good quality - ≥ 1 minor issue detected
 * - C (3.0): Warning - ≥ 1 major issue detected
 * - D (4.0): Critical - ≥ 1 critical issue detected
 * - E (5.0): Blocker - ≥ 1 blocker issue detected
 *
 * These ratings apply to:
 * - reliability_rating (bugs count)
 * - security_rating (vulnerabilities count)
 * - sqale_rating / maintainability_rating (code smells count)
 */
export const RATING_THRESHOLDS = {
  A: { min: 0, max: 1 },
  B: { min: 1, max: 2 },
  C: { min: 2, max: 3 },
  D: { min: 3, max: 4 },
  E: { min: 4, max: 5 },
} as const;

/**
 * Code coverage quality thresholds (percentage)
 */
export const COVERAGE_THRESHOLDS = {
  EXCELLENT: 80, // >= 80% = green (excellent)
  GOOD: 60, // >= 60% = yellow (good)
  FAIR: 40, // >= 40% = orange (fair)
  // < 40% = red (poor)
} as const;

/**
 * Code duplication quality thresholds (percentage)
 */
export const DUPLICATION_THRESHOLDS = {
  EXCELLENT: 5, // <= 5% = good (green indicator)
  ACCEPTABLE: 10, // <= 10% = acceptable (yellow indicator)
  // > 10% = poor (red indicator)
} as const;
