import { VulnerabilityReport } from "@my-project/shared";

/**
 * Generates a unique key for an image based on digest and namespace.
 * Falls back to repository:tag:namespace if digest is not available.
 */
export function getImageKey(report: VulnerabilityReport): string {
  const namespace = report.metadata.namespace || "";
  const digest = report.report.artifact.digest;
  const repository = report.report.artifact.repository;
  const tag = report.report.artifact.tag || "latest";

  if (digest) {
    return `${digest}-${namespace}`;
  }
  return `${repository}:${tag}-${namespace}`;
}

/**
 * Sorts reports by update timestamp (newest first).
 */
function sortByTimestamp(a: VulnerabilityReport, b: VulnerabilityReport): number {
  const aTime = a.report.updateTimestamp ? new Date(a.report.updateTimestamp).getTime() : 0;
  const bTime = b.report.updateTimestamp ? new Date(b.report.updateTimestamp).getTime() : 0;
  return bTime - aTime;
}

/**
 * Result of grouping reports by image key.
 * Provides both the grouped map and a list of deduplicated reports (most recent per image).
 */
export interface GroupedReportsResult {
  /** Map of image key to all reports for that image */
  groups: Map<string, VulnerabilityReport[]>;
  /** Most recent report for each unique image */
  deduplicated: VulnerabilityReport[];
}

/**
 * Groups VulnerabilityReports by unique image key and returns both the groups
 * and the deduplicated list (most recent report per image).
 *
 * Use this when you need:
 * - Just the deduplicated reports: `result.deduplicated`
 * - Both groups and deduplicated: spread the result
 */
export function groupReportsByImage(reports: VulnerabilityReport[]): GroupedReportsResult {
  const groups = new Map<string, VulnerabilityReport[]>();

  for (const report of reports) {
    const key = getImageKey(report);
    const existing = groups.get(key) || [];
    existing.push(report);
    groups.set(key, existing);
  }

  const deduplicated: VulnerabilityReport[] = [];
  for (const groupReports of groups.values()) {
    const sorted = [...groupReports].sort(sortByTimestamp);
    deduplicated.push(sorted[0]);
  }

  return { groups, deduplicated };
}
