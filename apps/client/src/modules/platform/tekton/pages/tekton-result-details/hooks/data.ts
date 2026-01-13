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
 * @param enabled - Only fetch when true (e.g., when Details tab is active)
 */
export const useTektonResultPipelineRunLogsQuery = (enabled: boolean = true) => {
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
    enabled, // Only fetch when enabled
  });
};

/**
 * Hook to fetch task list (metadata only, no logs) from a PipelineRun
 * Fast, lightweight query that returns just task names for the menu
 */
export const useTektonResultTaskListQuery = () => {
  const params = routeTektonResultPipelineRunDetails.useParams();
  const trpc = useTRPCClient();
  const { clusterName } = useClusterStore(useShallow((state) => ({ clusterName: state.clusterName })));

  return useQuery({
    queryKey: ["tektonResults", "taskList", clusterName, params.namespace, params.resultUid, params.recordUid],
    queryFn: () =>
      trpc.tektonResults.getTaskList.query({
        namespace: params.namespace,
        resultUid: params.resultUid,
        recordUid: params.recordUid,
      }),
  });
};

/**
 * Hook to fetch logs for a specific TaskRun (lazy-loaded)
 * Only fetches when taskRunName is provided and enabled
 */
export const useTektonResultTaskRunLogsQuery = (taskRunName: string | undefined) => {
  const params = routeTektonResultPipelineRunDetails.useParams();
  const trpc = useTRPCClient();
  const { clusterName } = useClusterStore(useShallow((state) => ({ clusterName: state.clusterName })));

  return useQuery({
    queryKey: ["tektonResults", "taskRunLogs", clusterName, params.namespace, params.resultUid, taskRunName],
    queryFn: () =>
      trpc.tektonResults.getTaskRunLogs.query({
        namespace: params.namespace,
        resultUid: params.resultUid,
        taskRunName: taskRunName!,
      }),
    enabled: !!taskRunName, // Only fetch when task is selected
  });
};
