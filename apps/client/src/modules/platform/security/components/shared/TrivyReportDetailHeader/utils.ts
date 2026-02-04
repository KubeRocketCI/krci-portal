interface SummaryStatItem {
  label: string;
  value: number;
  colorClass: string;
}

interface AuditSummary {
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

interface VulnSummary extends AuditSummary {
  unknownCount: number;
}

export function getAuditSummaryStats(summary: AuditSummary): SummaryStatItem[] {
  return [
    { label: "Critical", value: summary.criticalCount, colorClass: "text-red-600 dark:text-red-400" },
    { label: "High", value: summary.highCount, colorClass: "text-orange-500 dark:text-orange-400" },
    { label: "Medium", value: summary.mediumCount, colorClass: "text-yellow-500 dark:text-yellow-400" },
    { label: "Low", value: summary.lowCount, colorClass: "text-blue-500 dark:text-blue-400" },
  ];
}

export function getVulnSummaryStats(summary: VulnSummary): SummaryStatItem[] {
  return [
    ...getAuditSummaryStats(summary),
    { label: "Unknown", value: summary.unknownCount, colorClass: "text-gray-500 dark:text-gray-400" },
  ];
}
