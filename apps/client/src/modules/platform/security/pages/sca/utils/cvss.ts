import { CVSS_COLORS } from "../constants/colors";

/**
 * Get the color for a CVSS score based on severity ranges
 * @param score CVSS score (0-10)
 * @returns Hex color code
 */
export function getCvssColor(score: number | undefined): string {
  if (score === undefined || score === 0) {
    return CVSS_COLORS.NONE;
  }

  if (score >= 9.0) return CVSS_COLORS.CRITICAL;
  if (score >= 7.0) return CVSS_COLORS.HIGH;
  if (score >= 4.0) return CVSS_COLORS.MEDIUM;

  return CVSS_COLORS.LOW;
}
