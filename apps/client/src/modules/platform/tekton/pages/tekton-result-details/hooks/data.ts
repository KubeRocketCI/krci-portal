import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { routeTektonResultPipelineRunDetails } from "../route";

/**
 * Hook to fetch a single PipelineRun from Tekton Results
 * Uses route params to get namespace, resultUid, and recordUid
 */
export const useTektonResultPipelineRunQuery = () => {
  const params = routeTektonResultPipelineRunDetails.useParams();
  const trpc = useTRPCClient();
  const { clusterName } = useClusterStore(useShallow((state) => ({ clusterName: state.clusterName })));

  return useQuery({
    queryKey: [
      "tektonResults",
      "pipelineRun",
      clusterName, // Keep in queryKey for cache separation
      params.namespace,
      params.resultUid,
      params.recordUid,
    ],
    queryFn: () =>
      trpc.tektonResults.getPipelineRun.query({
        namespace: params.namespace,
        resultUid: params.resultUid,
        recordUid: params.recordUid,
      }),
  });
};

/**
 * Hook to fetch logs for a PipelineRun from Tekton Results
 * Returns formatted logs with [task-name] prefixes
 */
export const useTektonResultPipelineRunLogsQuery = () => {
  const params = routeTektonResultPipelineRunDetails.useParams();
  const trpc = useTRPCClient();
  const { clusterName } = useClusterStore(useShallow((state) => ({ clusterName: state.clusterName })));

  return useQuery({
    queryKey: [
      "tektonResults",
      "pipelineRunLogs",
      clusterName, // Keep in queryKey for cache separation
      params.namespace,
      params.resultUid,
      params.recordUid,
    ],
    queryFn: () =>
      trpc.tektonResults.getPipelineRunLogs.query({
        namespace: params.namespace,
        resultUid: params.resultUid,
        recordUid: params.recordUid,
      }),
  });
};
