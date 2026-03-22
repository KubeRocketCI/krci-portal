import React from "react";
import { MetricBadge } from "@/modules/platform/security/pages/sast-project-details/components/MetricBadge";
import { getRatingLabel, parsePercentage, parseCount } from "@/modules/platform/security/pages/sast/utils";
import { SonarQubeMetricsListProps } from "./types";
import { SonarQubeURLService } from "@/k8s/services/link-creation/sonar";

function wrapWithLink(url: string | undefined, children: React.ReactNode): React.ReactNode {
  if (!url) return children;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-80">
      {children}
    </a>
  );
}

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
export function SonarQubeMetricsList({ measures, sonarBaseUrl, projectKey }: SonarQubeMetricsListProps) {
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

  const canLink = !!sonarBaseUrl && !!projectKey;

  const metricUrls = canLink
    ? {
        vulnerabilities: SonarQubeURLService.createLinkByIssueType({
          baseURL: sonarBaseUrl,
          codebaseName: projectKey,
          issueType: "VULNERABILITY",
        }),
        bugs: SonarQubeURLService.createLinkByIssueType({
          baseURL: sonarBaseUrl,
          codebaseName: projectKey,
          issueType: "BUG",
        }),
        codeSmells: SonarQubeURLService.createLinkByIssueType({
          baseURL: sonarBaseUrl,
          codebaseName: projectKey,
          issueType: "CODE_SMELL",
        }),
        hotspots: SonarQubeURLService.createSecurityHotspotsLink({
          baseURL: sonarBaseUrl,
          codebaseName: projectKey,
        }),
        coverage: SonarQubeURLService.createLinkByMetricName({
          baseURL: sonarBaseUrl,
          codebaseName: projectKey,
          metricName: "coverage",
        }),
        duplications: SonarQubeURLService.createLinkByMetricName({
          baseURL: sonarBaseUrl,
          codebaseName: projectKey,
          metricName: "duplicated_lines_density",
        }),
      }
    : null;

  return (
    <div className="flex items-center gap-6">
      {wrapWithLink(
        metricUrls?.vulnerabilities,
        <MetricBadge rating={vulnerabilitiesRating} value={vulnerabilities} label="Vulnerabilities" />
      )}
      {wrapWithLink(metricUrls?.bugs, <MetricBadge rating={bugsRating} value={bugs} label="Bugs" />)}
      {wrapWithLink(
        metricUrls?.codeSmells,
        <MetricBadge rating={codeSmellsRating} value={codeSmells} label="Code Smells" />
      )}
      {wrapWithLink(
        metricUrls?.hotspots,
        <MetricBadge rating={hotspotsRating} value={hotspotsReviewed} label="Hotspots Reviewed" type="percentage" />
      )}
      {wrapWithLink(metricUrls?.coverage, <MetricBadge value={coverage} label="Coverage" type="percentage" />)}
      {wrapWithLink(
        metricUrls?.duplications,
        <MetricBadge value={duplications} label="Duplications" type="percentage" />
      )}
    </div>
  );
}
