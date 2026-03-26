import { SEVERITY_COLORS } from "@/modules/platform/security/constants/severity";
import { DependencyTrackMetricsListProps } from "./types";

/**
 * Reusable DependencyTrack metrics list
 *
 * Displays 5 key severity metrics horizontally:
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
      {/* Critical */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: SEVERITY_COLORS.CRITICAL }} />
        <span className="text-muted-foreground text-sm">
          Critical: <span className="text-foreground font-medium">{metrics.critical || 0}</span>
        </span>
      </div>

      {/* High */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: SEVERITY_COLORS.HIGH }} />
        <span className="text-muted-foreground text-sm">
          High: <span className="text-foreground font-medium">{metrics.high || 0}</span>
        </span>
      </div>

      {/* Medium */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: SEVERITY_COLORS.MEDIUM }} />
        <span className="text-muted-foreground text-sm">
          Medium: <span className="text-foreground font-medium">{metrics.medium || 0}</span>
        </span>
      </div>

      {/* Low */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: SEVERITY_COLORS.LOW }} />
        <span className="text-muted-foreground text-sm">
          Low: <span className="text-foreground font-medium">{metrics.low || 0}</span>
        </span>
      </div>

      {/* Unassigned */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: SEVERITY_COLORS.UNASSIGNED }} />
        <span className="text-muted-foreground text-sm">
          Unassigned: <span className="text-foreground font-medium">{metrics.unassigned || 0}</span>
        </span>
      </div>
    </div>
  );
}
