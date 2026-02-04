import { KubeMetadata } from "@my-project/shared";

/**
 * Common shape for reports that have artifact and timestamp data.
 * Both VulnerabilityReport and ExposedSecretReport satisfy this interface.
 */
export interface ReportWithArtifact {
  metadata: KubeMetadata;
  report: {
    artifact: {
      digest?: string;
      repository: string;
      tag?: string;
    };
    updateTimestamp?: string;
    [key: string]: unknown;
  };
}

/**
 * Generates a unique key for an image based on digest and namespace.
 * Falls back to repository:tag:namespace if digest is not available.
 */
export function getImageKey(report: ReportWithArtifact): string {
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
function sortByTimestamp(a: ReportWithArtifact, b: ReportWithArtifact): number {
  const aTime = a.report.updateTimestamp ? new Date(a.report.updateTimestamp).getTime() : 0;
  const bTime = b.report.updateTimestamp ? new Date(b.report.updateTimestamp).getTime() : 0;
  return bTime - aTime;
}

/**
 * Result of grouping reports by image key.
 * Provides both the grouped map and a list of deduplicated reports (most recent per image).
 */
export interface GroupedReportsResult<T extends ReportWithArtifact> {
  /** Map of image key to all reports for that image */
  groups: Map<string, T[]>;
  /** Most recent report for each unique image */
  deduplicated: T[];
}

/**
 * Groups reports by unique image key and returns both the groups
 * and the deduplicated list (most recent report per image).
 *
 * Works with any report type that has artifact and timestamp data
 * (VulnerabilityReport, ExposedSecretReport, etc.)
 */
export function groupReportsByImage<T extends ReportWithArtifact>(reports: T[]): GroupedReportsResult<T> {
  const groups = new Map<string, T[]>();

  for (const report of reports) {
    const key = getImageKey(report);
    const existing = groups.get(key) || [];
    existing.push(report);
    groups.set(key, existing);
  }

  const deduplicated: T[] = [];
  for (const groupReports of groups.values()) {
    const sorted = [...groupReports].sort(sortByTimestamp);
    deduplicated.push(sorted[0]);
  }

  return { groups, deduplicated };
}
