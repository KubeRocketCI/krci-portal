import type { SelectOption } from "@/core/components/form";

/**
 * Shared filter options for Trivy security compliance and config audit views
 * Used by ControlsTableFilter and ChecksListFilter components
 */

export const SEVERITY_FILTER_OPTIONS: SelectOption[] = [
  { label: "All severities", value: "all" },
  { label: "Critical", value: "critical" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

export const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { label: "All", value: "all" },
  { label: "Passed", value: "pass" },
  { label: "Failed", value: "fail" },
];
