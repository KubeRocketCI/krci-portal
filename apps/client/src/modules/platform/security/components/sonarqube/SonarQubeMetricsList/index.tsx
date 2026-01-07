import { MetricBadge } from "@/modules/platform/security/pages/sast-project-details/components/MetricBadge";
import { getRatingLabel, parsePercentage, parseCount } from "@/modules/platform/security/pages/sast/utils";
import { SonarQubeMetricsListProps } from "./types";

/**
 * Reusable SonarQube metrics badges list
 *
 * Displays 6 key SonarQube metrics as vertical badges:
 * - Vulnerabilities (with rating)
 * - Bugs (with rating)
 * - Code Smells (with rating)
 * - Hotspots Reviewed (with rating, percentage)
 * - Coverage (percentage with indicator)
 * - Duplications (percentage with indicator)
 *
 * Extracted from SAST ProjectHeader for reuse across the application.
 *
 * @example
 * <SonarQubeMetricsList measures={data?.measures} />
 */
export function SonarQubeMetricsList({ measures }: SonarQubeMetricsListProps) {
  if (!measures) return null;

  // Extract and parse metrics
  const vulnerabilities = parseCount(measures.vulnerabilities);
  const vulnerabilitiesRating = getRatingLabel(measures.security_rating);

  const bugs = parseCount(measures.bugs);
  const bugsRating = getRatingLabel(measures.reliability_rating);

  const codeSmells = parseCount(measures.code_smells);
  const codeSmellsRating = getRatingLabel(measures.sqale_rating);

  const hotspotsReviewed = parsePercentage(measures.security_hotspots_reviewed);
  const hotspotsRating = getRatingLabel(measures.security_review_rating);

  const coverage = parsePercentage(measures.coverage);
  const duplications = parsePercentage(measures.duplicated_lines_density);

  return (
    <div className="flex items-center gap-6">
      <MetricBadge rating={vulnerabilitiesRating} value={vulnerabilities} label="Vulnerabilities" />
      <MetricBadge rating={bugsRating} value={bugs} label="Bugs" />
      <MetricBadge rating={codeSmellsRating} value={codeSmells} label="Code Smells" />
      <MetricBadge rating={hotspotsRating} value={hotspotsReviewed} label="Hotspots Reviewed" type="percentage" />
      <MetricBadge value={coverage} label="Coverage" type="percentage" />
      <MetricBadge value={duplications} label="Duplications" type="percentage" />
    </div>
  );
}
