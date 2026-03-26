import React from "react";
import { getRatingLabel, parsePercentage, parseCount } from "@/modules/platform/security/pages/sast/utils";
import {
  getRatingBgClass,
  getRatingTextClass,
  getCoverageColorClass,
  isDuplicationGood,
} from "@/modules/platform/security/pages/sast/utils";
import { INDICATOR_COLORS } from "@/modules/platform/security/pages/sast/constants";
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
 * Reusable SonarQube metrics list
 *
 * Displays 6 key SonarQube metrics horizontally:
 * - Vulnerabilities (with rating)
 * - Bugs (with rating)
 * - Code Smells (with rating)
 * - Hotspots Reviewed (with rating, percentage)
 * - Coverage (percentage with indicator)
 * - Duplications (percentage with indicator)
 *
 * When used in widgets, badges are not clickable (linkToExternal=false).
 * When used on internal SAST pages, badges link to external SonarQube (linkToExternal=true).
 *
 * Extracted from SAST ProjectHeader for reuse across the application.
 *
 * @example
 * <SonarQubeMetricsList measures={data?.measures} linkToExternal={true} />
 */
export function SonarQubeMetricsList({
  measures,
  sonarBaseUrl,
  projectKey,
  linkToExternal = false,
}: SonarQubeMetricsListProps) {
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

  const canLink = linkToExternal && !!sonarBaseUrl && !!projectKey;

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
      {/* Vulnerabilities */}
      {wrapWithLink(
        metricUrls?.vulnerabilities,
        <div className="flex items-center gap-2">
          {vulnerabilitiesRating && (
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full ${getRatingBgClass(vulnerabilitiesRating)}`}
            >
              <span className={`text-xs font-semibold ${getRatingTextClass(vulnerabilitiesRating)}`}>
                {vulnerabilitiesRating.toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-muted-foreground text-sm">
            Vulnerabilities: <span className="text-foreground font-medium">{vulnerabilities}</span>
          </span>
        </div>
      )}

      {/* Bugs */}
      {wrapWithLink(
        metricUrls?.bugs,
        <div className="flex items-center gap-2">
          {bugsRating && (
            <div className={`flex h-6 w-6 items-center justify-center rounded-full ${getRatingBgClass(bugsRating)}`}>
              <span className={`text-xs font-semibold ${getRatingTextClass(bugsRating)}`}>
                {bugsRating.toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-muted-foreground text-sm">
            Bugs: <span className="text-foreground font-medium">{bugs}</span>
          </span>
        </div>
      )}

      {/* Code Smells */}
      {wrapWithLink(
        metricUrls?.codeSmells,
        <div className="flex items-center gap-2">
          {codeSmellsRating && (
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full ${getRatingBgClass(codeSmellsRating)}`}
            >
              <span className={`text-xs font-semibold ${getRatingTextClass(codeSmellsRating)}`}>
                {codeSmellsRating.toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-muted-foreground text-sm">
            Code Smells: <span className="text-foreground font-medium">{codeSmells}</span>
          </span>
        </div>
      )}

      {/* Hotspots Reviewed */}
      {wrapWithLink(
        metricUrls?.hotspots,
        <div className="flex items-center gap-2">
          {hotspotsRating && (
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full ${getRatingBgClass(hotspotsRating)}`}
            >
              <span className={`text-xs font-semibold ${getRatingTextClass(hotspotsRating)}`}>
                {hotspotsRating.toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-muted-foreground text-sm">
            Hotspots: <span className="text-foreground font-medium">{hotspotsReviewed}%</span>
          </span>
        </div>
      )}

      {/* Coverage */}
      {wrapWithLink(
        metricUrls?.coverage,
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${coverage >= 60 ? INDICATOR_COLORS.GOOD : INDICATOR_COLORS.WARNING}`}
          />
          <span className="text-muted-foreground text-sm">
            Coverage: <span className={`font-medium ${getCoverageColorClass(coverage)}`}>{coverage}%</span>
          </span>
        </div>
      )}

      {/* Duplications */}
      {wrapWithLink(
        metricUrls?.duplications,
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${isDuplicationGood(duplications) ? INDICATOR_COLORS.GOOD : INDICATOR_COLORS.WARNING}`}
          />
          <span className="text-muted-foreground text-sm">
            Duplications: <span className="text-foreground font-medium">{duplications}%</span>
          </span>
        </div>
      )}
    </div>
  );
}
