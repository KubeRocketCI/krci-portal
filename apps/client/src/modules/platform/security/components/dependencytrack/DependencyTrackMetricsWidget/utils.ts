/**
 * Risk score thresholds for DependencyTrack metrics
 *
 * Based on OWASP Dependency-Track risk scoring:
 * - HIGH (>= 7): Critical vulnerabilities present, immediate attention required
 * - MEDIUM (>= 4): Medium severity issues, should be addressed soon
 * - LOW (< 4): Low risk, acceptable security posture
 */
export const RISK_SCORE_THRESHOLDS = {
  HIGH: 7,
  MEDIUM: 4,
} as const;

/**
 * Determines badge variant based on DependencyTrack risk score
 *
 * @param score - Inherited risk score from DependencyTrack (0-10 scale)
 * @returns Badge variant for visual styling
 *
 * @example
 * getRiskScoreBadgeVariant(8.5) // returns "destructive" (high risk)
 * getRiskScoreBadgeVariant(5.2) // returns "default" (medium risk)
 * getRiskScoreBadgeVariant(2.1) // returns "secondary" (low risk)
 */
export function getRiskScoreBadgeVariant(score: number): "destructive" | "default" | "secondary" {
  if (score >= RISK_SCORE_THRESHOLDS.HIGH) {
    return "destructive";
  }
  if (score >= RISK_SCORE_THRESHOLDS.MEDIUM) {
    return "default";
  }
  return "secondary";
}
