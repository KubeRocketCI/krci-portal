import { ExposedSecretReport, exposedSecretReportLabels } from "@my-project/shared";
import { getImageKey, groupReportsByImage } from "@/modules/platform/security/components/trivy";
import { ConsolidatedSecretImage } from "../types";
import { ImageResource } from "../../trivy-vulnerabilities/types";

/**
 * Extracts resource information from an ExposedSecretReport
 */
function extractResource(report: ExposedSecretReport): ImageResource {
  const labels = report.metadata.labels || {};
  return {
    kind: labels[exposedSecretReportLabels.resourceKind] || "",
    name: labels[exposedSecretReportLabels.resourceName] || "",
    containerName: labels[exposedSecretReportLabels.containerName] || "",
  };
}

/**
 * Converts a report group to a consolidated image with aggregated data.
 */
function createConsolidatedImage(
  imageKey: string,
  latestReport: ExposedSecretReport,
  allReports: ExposedSecretReport[]
): ConsolidatedSecretImage {
  const summary = latestReport.report.summary;
  const totalSecrets = latestReport.report.secrets?.length || 0;

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
    totalSecrets,
    lastScan: latestReport.report.updateTimestamp || "",
    resources: allReports.map(extractResource),
    reportName: latestReport.metadata.name,
  };
}

/**
 * Sort comparator: prioritizes by critical count, then high count, then total secrets.
 */
function compareBySeverity(a: ConsolidatedSecretImage, b: ConsolidatedSecretImage): number {
  if (b.criticalCount !== a.criticalCount) return b.criticalCount - a.criticalCount;
  if (b.highCount !== a.highCount) return b.highCount - a.highCount;
  return b.totalSecrets - a.totalSecrets;
}

/**
 * Consolidates ExposedSecretReports by unique image.
 * Groups reports scanning the same image (by digest + namespace) and aggregates:
 * - Severity counts from the most recent scan
 * - List of resources where the image is used
 */
export function consolidateSecretImages(reports: ExposedSecretReport[]): ConsolidatedSecretImage[] {
  if (!reports?.length) return [];

  const { groups, deduplicated } = groupReportsByImage(reports);

  const consolidated = deduplicated.map((latestReport) => {
    const imageKey = getImageKey(latestReport);
    const allReports = groups.get(imageKey) || [latestReport];
    return createConsolidatedImage(imageKey, latestReport, allReports);
  });

  return consolidated.sort(compareBySeverity);
}
