import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { routeTektonResultPipelineRunDetails } from "../route";

/**
 * Common hook to get route params and cluster context for Tekton Result queries
 */
function useTektonResultContext() {
  const params = routeTektonResultPipelineRunDetails.useParams();
  const trpc = useTRPCClient();
  const { clusterName } = useClusterStore(useShallow((state) => ({ clusterName: state.clusterName })));

  return { params, trpc, clusterName };
}

/**
 * Hook to fetch a single PipelineRun from Tekton Results
 * Uses route params to get namespace, resultUid, and recordUid
 */
export function useTektonResultPipelineRunQuery() {
  const { params, trpc, clusterName } = useTektonResultContext();

  return useQuery({
    queryKey: ["tektonResults", "pipelineRun", clusterName, params.namespace, params.resultUid, params.recordUid],
    queryFn: () =>
      trpc.tektonResults.getPipelineRun.query({
        namespace: params.namespace,
        resultUid: params.resultUid,
        recordUid: params.recordUid,
      }),
  });
}

/**
 * Hook to fetch logs for a PipelineRun from Tekton Results
 * Returns formatted logs with [task-name] prefixes
 * @param enabled - Only fetch when true (e.g., when Details tab is active)
 */
export function useTektonResultPipelineRunLogsQuery(enabled = true) {
  const { params, trpc, clusterName } = useTektonResultContext();

  return useQuery({
    queryKey: ["tektonResults", "pipelineRunLogs", clusterName, params.namespace, params.resultUid, params.recordUid],
    queryFn: () =>
      trpc.tektonResults.getPipelineRunLogs.query({
        namespace: params.namespace,
        resultUid: params.resultUid,
        recordUid: params.recordUid,
      }),
    enabled,
  });
}

/**
 * Hook to fetch task list (metadata only, no logs) from a PipelineRun
 * Fast, lightweight query that returns just task names for the menu
 */
export function useTektonResultTaskListQuery() {
  const { params, trpc, clusterName } = useTektonResultContext();

  return useQuery({
    queryKey: ["tektonResults", "taskList", clusterName, params.namespace, params.resultUid, params.recordUid],
    queryFn: () =>
      trpc.tektonResults.getTaskList.query({
        namespace: params.namespace,
        resultUid: params.resultUid,
        recordUid: params.recordUid,
      }),
  });
}

/**
 * Hook to fetch logs for a specific TaskRun (lazy-loaded)
 * Only fetches when taskRunName is provided
 */
export function useTektonResultTaskRunLogsQuery(taskRunName: string | undefined) {
  const { params, trpc, clusterName } = useTektonResultContext();

  return useQuery({
    queryKey: ["tektonResults", "taskRunLogs", clusterName, params.namespace, params.resultUid, taskRunName],
    queryFn: () =>
      trpc.tektonResults.getTaskRunLogs.query({
        namespace: params.namespace,
        resultUid: params.resultUid,
        taskRunName: taskRunName!,
      }),
    enabled: !!taskRunName,
  });
}
