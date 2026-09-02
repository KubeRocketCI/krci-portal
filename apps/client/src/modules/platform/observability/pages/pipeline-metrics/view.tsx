import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { Activity } from "lucide-react";
import { useMemo } from "react";
import { PIPELINE_TYPES } from "@my-project/shared";
import { usePipelineMetricsFilters } from "./hooks/usePipelineMetricsFilters";
import { useMetricsData } from "./hooks/useMetricsData";
import { MetricsOverview } from "./components/MetricsOverview";
import { PipelineTypeBreakdown } from "./components/PipelineTypeBreakdown";
import { PipelineActivityChart } from "./components/PipelineActivityChart";
import { TimeRangeSelector } from "./components/TimeRangeSelector";
import { CodebaseSelector } from "./components/CodebaseSelector";

export default function PipelineMetricsPageContent() {
  const { filters, setCodebase, setTimeRange } = usePipelineMetricsFilters();
  const { namespace, timeRange, codebase } = filters;

  const { overall, build, review, deploy, isLoading, isError, error } = useMetricsData(filters);

  const pipelineMetrics = useMemo(
    () => ({
      [PIPELINE_TYPES.BUILD]: build?.summary ?? null,
      [PIPELINE_TYPES.REVIEW]: review?.summary ?? null,
      [PIPELINE_TYPES.DEPLOY]: deploy?.summary ?? null,
    }),
    [build?.summary, review?.summary, deploy?.summary]
  );

  return (
    <PageWrapper breadcrumbs={[{ label: "Observability" }, { label: "Pipeline Metrics" }]}>
      <PageContentWrapper
        icon={Activity}
        title="Pipeline Metrics"
        description={`Aggregated pipeline statistics for namespace: ${namespace}`}
        actions={
          <div className="flex items-center gap-4">
            <CodebaseSelector namespace={namespace} value={codebase} onChange={setCodebase} />
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </div>
        }
      >
        <div className="space-y-8">
          {isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">Failed to load metrics</p>
              <p className="mt-1 text-sm text-red-600">{error instanceof Error ? error.message : "Unknown error"}</p>
            </div>
          )}

          <MetricsOverview summary={overall?.summary} successRate={overall?.successRate} isLoading={isLoading} />

          <PipelineTypeBreakdown metrics={pipelineMetrics} isLoading={isLoading} />

          <PipelineActivityChart namespace={namespace} timeRange={timeRange} codebase={codebase} />
        </div>
      </PageContentWrapper>
    </PageWrapper>
  );
}
