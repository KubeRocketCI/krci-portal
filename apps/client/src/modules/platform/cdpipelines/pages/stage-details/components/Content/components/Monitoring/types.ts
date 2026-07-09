import type { MetricRange, PodPhaseByApp } from "@my-project/shared";

export interface ToolbarProps {
  range: MetricRange;
  onRangeChange: (range: MetricRange) => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (next: boolean) => void;
  lastUpdatedAt: number | undefined;
  isStale: boolean;
  /** Apps the user has selected; null means "all". */
  selectedApps: string[] | null;
  /** Apps available to select (resolved from usePipelineAppCodebasesWatch). */
  availableApps: string[];
  onAppsChange: (next: string[]) => void;
  /** Reset the filter to "all applications" (clears the URL param). */
  onAppsClear: () => void;
}

export interface AppMultiSelectProps {
  selectedApps: string[] | null;
  availableApps: string[];
  onChange: (next: string[]) => void;
  onClear: () => void;
}

export interface PodPhasePanelProps {
  data: PodPhaseByApp[];
  selectedApps?: ReadonlySet<string>;
}
