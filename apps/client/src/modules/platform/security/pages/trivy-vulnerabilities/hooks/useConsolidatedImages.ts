import { useMemo } from "react";
import { VulnerabilityReport, vulnerabilityReportLabels } from "@my-project/shared";
import { getImageKey, groupReportsByImage } from "@/modules/platform/security/components/trivy";
import { ConsolidatedVulnerabilityImage, ImageResource } from "../types";

/**
 * Extracts resource information from a VulnerabilityReport
 */
function extractResource(report: VulnerabilityReport): ImageResource {
  const labels = report.metadata.labels || {};
  return {
    kind: labels[vulnerabilityReportLabels.resourceKind] || "",
    name: labels[vulnerabilityReportLabels.resourceName] || "",
    containerName: labels[vulnerabilityReportLabels.containerName] || "",
  };
}

/**
 * Converts a report group to a consolidated image with aggregated data.
 */
function createConsolidatedImage(
  imageKey: string,
  latestReport: VulnerabilityReport,
  allReports: VulnerabilityReport[]
): ConsolidatedVulnerabilityImage {
  const summary = latestReport.report.summary;
  const total =
    summary.criticalCount + summary.highCount + summary.mediumCount + summary.lowCount + summary.unknownCount;

  return {
    imageKey,
    repository: latestReport.report.artifact.repository,
    tag: latestReport.report.artifact.tag || "latest",
    digest: latestReport.report.artifact.digest,
    namespace: latestReport.metadata.namespace || "",
    criticalCount: summary.criticalCount,
    highCount: summary.highCount,
    mediumCount: summary.mediumCount,
    lowCount: summary.lowCount,
    unknownCount: summary.unknownCount,
    total,
    lastScan: latestReport.report.updateTimestamp || "",
    resources: allReports.map(extractResource),
    reportName: latestReport.metadata.name,
  };
}

/**
 * Sort comparator: prioritizes by critical count, then high count, then total.
 */
function compareBySeverity(a: ConsolidatedVulnerabilityImage, b: ConsolidatedVulnerabilityImage): number {
  if (b.criticalCount !== a.criticalCount) return b.criticalCount - a.criticalCount;
  if (b.highCount !== a.highCount) return b.highCount - a.highCount;
  return b.total - a.total;
}

/**
 * Hook that consolidates VulnerabilityReports by unique image.
 * Groups reports scanning the same image (by digest + namespace) and aggregates:
 * - Severity counts from the most recent scan
 * - List of resources where the image is used
 */
export function useConsolidatedImages(reports: VulnerabilityReport[]): ConsolidatedVulnerabilityImage[] {
  return useMemo(() => {
    if (!reports?.length) return [];

    const { groups, deduplicated } = groupReportsByImage(reports);

    const consolidated = deduplicated.map((latestReport) => {
      const imageKey = getImageKey(latestReport);
      const allReports = groups.get(imageKey) || [latestReport];
      return createConsolidatedImage(imageKey, latestReport, allReports);
    });

    return consolidated.sort(compareBySeverity);
  }, [reports]);
}
