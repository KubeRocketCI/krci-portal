import { useMemo } from "react";
import { VulnerabilityReport } from "@my-project/shared";
import { useVulnerabilityReportWatchList } from "@/k8s/api/groups/Trivy/VulnerabilityReport/hooks";
import { groupReportsByImage } from "@/modules/platform/security/components/trivy";
import type {
  TrivyOverviewData,
  TrivyOverviewHookResult,
  NamespaceVulnerabilityData,
  VulnerableImageData,
} from "../../types";

export interface UseTrivyOverviewParams {
  /**
   * Namespace to filter vulnerability reports.
   * If provided, only reports from this namespace will be included.
   */
  namespace?: string;
}

/**
 * Extracts severity counts from a report summary.
 */
function extractSeverityCounts(report: VulnerabilityReport): {
  critical: number;
  high: number;
  medium: number;
  low: number;
  unknown: number;
  total: number;
} {
  const summary = report.report?.summary;
  const critical = summary?.criticalCount ?? 0;
  const high = summary?.highCount ?? 0;
  const medium = summary?.mediumCount ?? 0;
  const low = summary?.lowCount ?? 0;
  const unknown = summary?.unknownCount ?? 0;

  return {
    critical,
    high,
    medium,
    low,
    unknown,
    total: critical + high + medium + low + unknown,
  };
}

/**
 * Updates or creates a namespace entry in the aggregation map.
 */
function aggregateNamespaceData(
  namespaceMap: Map<string, NamespaceVulnerabilityData>,
  namespace: string,
  counts: ReturnType<typeof extractSeverityCounts>
): void {
  const existing = namespaceMap.get(namespace);
  if (existing) {
    existing.critical += counts.critical;
    existing.high += counts.high;
    existing.medium += counts.medium;
    existing.low += counts.low;
    existing.unknown += counts.unknown;
    existing.total += counts.total;
  } else {
    namespaceMap.set(namespace, { namespace, ...counts });
  }
}

/**
 * Hook to aggregate vulnerability data from VulnerabilityReports for the overview dashboard.
 *
 * IMPORTANT: This hook deduplicates reports by unique image (digest + namespace).
 * Each unique container image is counted only once, using data from the most recent scan.
 * This prevents over-counting when the same image is used in multiple containers/resources.
 *
 * Computes:
 * - Total vulnerabilities by severity (deduplicated)
 * - Fixable count (vulnerabilities with fixedVersion)
 * - Vulnerabilities grouped by namespace
 * - Top 10 vulnerable images sorted by total count
 * - Unique images scanned count
 *
 * @param params.namespace - Optional namespace to filter reports
 */
export function useTrivyOverview(params?: UseTrivyOverviewParams): TrivyOverviewHookResult {
  const watchList = useVulnerabilityReportWatchList({
    namespace: params?.namespace,
  });

  const overviewData = useMemo<TrivyOverviewData | null>(() => {
    const reports = watchList.data?.array;
    if (!reports?.length) return null;

    // Deduplicate reports - each unique image counted only once
    const { deduplicated: uniqueReports } = groupReportsByImage(reports);

    // Aggregation accumulators
    const totals = { critical: 0, high: 0, medium: 0, low: 0, unknown: 0, fixable: 0 };
    const namespaceMap = new Map<string, NamespaceVulnerabilityData>();
    const imageStatsList: VulnerableImageData[] = [];

    for (const report of uniqueReports) {
      const counts = extractSeverityCounts(report);
      const namespace = report.metadata?.namespace || "default";
      const artifact = report.report?.artifact;
      const vulnerabilities = report.report?.vulnerabilities;

      // Aggregate global severity counts
      totals.critical += counts.critical;
      totals.high += counts.high;
      totals.medium += counts.medium;
      totals.low += counts.low;
      totals.unknown += counts.unknown;

      // Count fixable vulnerabilities
      if (vulnerabilities) {
        totals.fixable += vulnerabilities.filter((v) => v.fixedVersion).length;
      }

      // Build image stats
      if (artifact) {
        imageStatsList.push({
          name: `${artifact.repository}:${artifact.tag || "latest"}`,
          namespace,
          reportName: report.metadata?.name || "",
          ...counts,
        });
      }

      // Aggregate per-namespace stats
      aggregateNamespaceData(namespaceMap, namespace, counts);
    }

    return {
      ...totals,
      totalVulnerabilities: totals.critical + totals.high + totals.medium + totals.low + totals.unknown,
      fixable: totals.fixable,
      imagesScanned: uniqueReports.length,
      byNamespace: Array.from(namespaceMap.values()).sort((a, b) => b.total - a.total),
      topImages: imageStatsList.sort((a, b) => b.total - a.total).slice(0, 10),
    };
  }, [watchList.data?.array]);

  return {
    data: overviewData,
    isLoading: watchList.isLoading,
    error: watchList.error,
  };
}
