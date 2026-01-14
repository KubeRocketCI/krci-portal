import { ProjectWithMetrics } from "@my-project/shared";
import { MetricCard } from "./MetricCard";
import { METRIC_CARDS } from "./constants";

interface MetricsGridProps {
  project: ProjectWithMetrics | null | undefined;
  isLoading: boolean;
}

/**
 * MetricsGrid component displaying all 8 metric cards in a responsive grid
 *
 * @param project - Project data with metrics
 * @param isLoading - Loading state
 *
 * @example
 * <MetricsGrid project={project} isLoading={isLoading} />
 */
export function MetricsGrid({ project, isLoading }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {METRIC_CARDS.map((config) => (
        <MetricCard key={config.id} config={config} project={project} isLoading={isLoading} />
      ))}
    </div>
  );
}
