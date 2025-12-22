import { usePipelineMetrics } from "@/k8s/tektonResults/hooks/usePipelineMetrics";
import { TimeRange, PIPELINE_TYPES } from "@my-project/shared";

export interface UseMetricsDataOptions {
  namespace: string;
  timeRange: TimeRange;
  codebase?: string;
}

export function useMetricsData({ namespace, timeRange, codebase }: UseMetricsDataOptions) {
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
