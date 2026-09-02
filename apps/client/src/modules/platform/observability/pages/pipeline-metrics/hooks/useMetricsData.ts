import { usePipelineMetrics } from "@/modules/platform/tekton/hooks/usePipelineMetrics";
import { PIPELINE_TYPES } from "@my-project/shared";
import { PipelineMetricsFilters } from "./usePipelineMetricsFilters";

export function useMetricsData({ namespace, timeRange, codebase }: PipelineMetricsFilters) {
  const overallMetrics = usePipelineMetrics(namespace, { timeRange, codebase });
  const buildMetrics = usePipelineMetrics(namespace, { timeRange, codebase, pipelineType: PIPELINE_TYPES.BUILD });
  const reviewMetrics = usePipelineMetrics(namespace, { timeRange, codebase, pipelineType: PIPELINE_TYPES.REVIEW });
  const deployMetrics = usePipelineMetrics(namespace, { timeRange, codebase, pipelineType: PIPELINE_TYPES.DEPLOY });

  return {
    overall: overallMetrics.data,
    build: buildMetrics.data,
    review: reviewMetrics.data,
    deploy: deployMetrics.data,
    isLoading: overallMetrics.isLoading || buildMetrics.isLoading || reviewMetrics.isLoading || deployMetrics.isLoading,
    isError: overallMetrics.isError || buildMetrics.isError || reviewMetrics.isError || deployMetrics.isError,
    error: overallMetrics.error || buildMetrics.error || reviewMetrics.error || deployMetrics.error,
  };
}
