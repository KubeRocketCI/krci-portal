import { SeverityBadge } from "./components/SeverityBadge";
import { DependencyTrackMetricsListProps } from "./types";

/**
 * Reusable DependencyTrack metrics badges list
 *
 * Displays 5 key severity metrics as vertical badges:
 * - Critical
 * - High
 * - Medium
 * - Low
 * - Unassigned
 *
 * @example
 * <DependencyTrackMetricsList metrics={project?.metrics} />
 */
export function DependencyTrackMetricsList({ metrics }: DependencyTrackMetricsListProps) {
  if (!metrics) return null;

  return (
    <div className="flex items-center gap-6">
      <SeverityBadge value={metrics.critical || 0} label="Critical" severity="critical" />
      <SeverityBadge value={metrics.high || 0} label="High" severity="high" />
      <SeverityBadge value={metrics.medium || 0} label="Medium" severity="medium" />
      <SeverityBadge value={metrics.low || 0} label="Low" severity="low" />
      <SeverityBadge value={metrics.unassigned || 0} label="Unassigned" severity="unassigned" />
    </div>
  );
}
