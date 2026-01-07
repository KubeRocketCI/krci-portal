export interface DependencyTrackMetricsWidgetProps {
  /**
   * DependencyTrack project name (usually matches codebase name)
   */
  projectName: string;

  /**
   * Default branch/version to search for (from Codebase spec.defaultBranch)
   * This ensures we show metrics for the correct branch when multiple versions exist
   */
  defaultBranch: string;
}
