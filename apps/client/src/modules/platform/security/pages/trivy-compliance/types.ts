import { ClusterComplianceReport } from "@my-project/shared";

/**
 * Get badge style classes based on compliance type (CIS, NSA, PSS variants)
 * Uses consistent color palette with dark mode support
 */
export function getComplianceTypeBadgeClasses(type: string): string {
  const normalizedType = type.toLowerCase();

  if (normalizedType === "cis") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  }
  if (normalizedType === "nsa") {
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  }
  if (normalizedType.startsWith("pss")) {
    return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
  }
  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
}

/**
 * Pass rate color class constants with dark mode support
 * Aligned with project color patterns
 */
export const PASS_RATE_TEXT_CLASSES = {
  EXCELLENT: "text-green-600 dark:text-green-400", // >= 90%
  GOOD: "text-amber-600 dark:text-amber-400", // >= 70%
  FAIR: "text-orange-600 dark:text-orange-400", // >= 50%
  POOR: "text-red-600 dark:text-red-400", // < 50%
} as const;

/**
 * Pass rate progress bar color classes
 */
export const PASS_RATE_PROGRESS_CLASSES = {
  EXCELLENT: "[&>div]:bg-green-500", // >= 90%
  GOOD: "[&>div]:bg-amber-500", // >= 70%
  FAIR: "[&>div]:bg-orange-500", // >= 50%
  POOR: "[&>div]:bg-red-500", // < 50%
} as const;

/**
 * Get text color class based on pass rate percentage
 *
 * @param passRate - Pass rate percentage (0-100)
 * @returns Tailwind text color class string with dark mode support
 */
export function getPassRateColorClass(passRate: number): string {
  if (passRate >= 90) return PASS_RATE_TEXT_CLASSES.EXCELLENT;
  if (passRate >= 70) return PASS_RATE_TEXT_CLASSES.GOOD;
  if (passRate >= 50) return PASS_RATE_TEXT_CLASSES.FAIR;
  return PASS_RATE_TEXT_CLASSES.POOR;
}

/**
 * Get progress bar color class based on pass rate percentage
 *
 * @param passRate - Pass rate percentage (0-100)
 * @returns Tailwind progress bar color class string
 */
export function getPassRateProgressClass(passRate: number): string {
  if (passRate >= 90) return PASS_RATE_PROGRESS_CLASSES.EXCELLENT;
  if (passRate >= 70) return PASS_RATE_PROGRESS_CLASSES.GOOD;
  if (passRate >= 50) return PASS_RATE_PROGRESS_CLASSES.FAIR;
  return PASS_RATE_PROGRESS_CLASSES.POOR;
}

/**
 * Consolidated compliance report data for table display.
 * Extracts key fields from ClusterComplianceReport for easier table rendering.
 */
export interface ConsolidatedComplianceReport {
  /** Report name (metadata.name) */
  name: string;
  /** Compliance ID from spec */
  id: string;
  /** Compliance title */
  title: string;
  /** Compliance description */
  description: string;
  /** Compliance type (cis, nsa, pss-baseline, pss-restricted) */
  type: string;
  /** Compliance version */
  version: string;
  /** Number of passed controls */
  passCount: number;
  /** Number of failed controls (null means not calculated) */
  failCount: number | null;
  /** Pass rate percentage (0-100) */
  passRate: number;
  /** Related external resources */
  relatedResources: string[];
  /** Last update timestamp */
  updateTimestamp: string | undefined;
  /** Original report for access to full data */
  originalReport: ClusterComplianceReport;
}

/**
 * Converts a ClusterComplianceReport to ConsolidatedComplianceReport for table display
 */
export function toConsolidatedComplianceReport(report: ClusterComplianceReport): ConsolidatedComplianceReport {
  const passCount = report.status?.summary?.passCount ?? 0;
  const failCount = report.status?.summary?.failCount ?? null;
  const total = passCount + (failCount ?? 0);
  const passRate = total > 0 ? Math.round((passCount / total) * 100) : 0;

  return {
    name: report.metadata.name ?? "",
    id: report.spec.compliance.id,
    title: report.spec.compliance.title,
    description: report.spec.compliance.description ?? "",
    type: report.spec.compliance.type,
    version: report.spec.compliance.version ?? "",
    passCount,
    failCount,
    passRate,
    relatedResources: report.spec.compliance.relatedResources ?? [],
    updateTimestamp: report.status?.updateTimestamp,
    originalReport: report,
  };
}
