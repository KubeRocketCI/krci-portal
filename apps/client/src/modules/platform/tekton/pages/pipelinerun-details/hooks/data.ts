import { usePipelineRunWatchItem } from "@/k8s/api/groups/Tekton/PipelineRun";
import { useTaskRunWatchList } from "@/k8s/api/groups/Tekton/TaskRun";
import { useTaskWatchList } from "@/k8s/api/groups/Tekton/Task";
import { useApprovalTaskWatchList } from "@/k8s/api/groups/KRCI/ApprovalTask";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import {
  ApprovalTask,
  DecodedTaskRun,
  PipelineRun,
  TaskRun,
  approvalTaskLabels,
  getPipelineRunTaskGraphDefinitions,
  normalizeHistoryPipelineRun,
  normalizeHistoryTaskRuns,
  parseRecordName,
  parseResultUidFromAnnotation,
  taskRunLabels,
  tektonResultAnnotations,
} from "@my-project/shared";
import React from "react";
import { RequestError } from "@/core/types/global";
import { buildPipelineRunNameFilter, SINGLE_RECORD_LOOKUP_PAGE_SIZE } from "../../../utils/celFilters";
import { isK8sNotFoundError } from "../../../utils/isK8sNotFoundError";
import { buildPipelineRunTasksByNameMap } from "./utils";
import { routePipelineRunDetails } from "../route";
import type { UnifiedPipelineRunData, UnifiedSource } from "../providers/PipelineRun/types";

export type { UnifiedPipelineRunData, UnifiedSource };

export interface UnifiedPipelineRunParams {
  namespace: string;
  name: string;
}

/**
 * Unified PipelineRun + TaskRuns for an explicit namespace/name (live K8s or Tekton Results).
 * Used by the details page provider and by embedded views (e.g. diagram dialog from the list).
 */
export function useUnifiedPipelineRunData({ namespace, name }: UnifiedPipelineRunParams): UnifiedPipelineRunData {
  const trpc = useTRPCClient();
  const { clusterName } = useClusterStore(useShallow((state) => ({ clusterName: state.clusterName })));

  // ── Step 1: K8s watch ──────────────────────────────────────────────────────
  const pipelineRunWatch = usePipelineRunWatchItem({
    namespace,
    name,
  });

  const k8sNotFound = !pipelineRunWatch.isLoading && isK8sNotFoundError(pipelineRunWatch.query.error);

  // Live TaskRuns, Tasks, and ApprovalTasks (only fetched when K8s PipelineRun exists)
  const hasLivePipelineRun = !k8sNotFound && !pipelineRunWatch.isLoading;

  const taskRunsWatch = useTaskRunWatchList({
    namespace,
    labels: { [taskRunLabels.parentPipelineRun]: name },
    queryOptions: { enabled: hasLivePipelineRun },
  });

  const approvalTasksWatch = useApprovalTaskWatchList({
    namespace,
    labels: { [approvalTaskLabels.parentPipelineRun]: name },
    queryOptions: { enabled: hasLivePipelineRun },
  });

  const tasksWatch = useTaskWatchList({
    namespace,
    queryOptions: { enabled: hasLivePipelineRun },
  });

  // ── Step 2: On K8s 404, search Tekton Results ─────────────────────────────
  // Use listRecords (not listResults) because data.metadata.name and data_type
  // are record-level CEL fields, not available on the results endpoint.
  const tektonSearch = useQuery({
    queryKey: ["tektonResults", "unifiedSearch", clusterName, namespace, name],
    queryFn: () =>
      trpc.tektonResults.listRecords.query({
        namespace,
        filter: buildPipelineRunNameFilter(name),
        pageSize: SINGLE_RECORD_LOOKUP_PAGE_SIZE,
        orderBy: "create_time desc",
      }),
    enabled: k8sNotFound,
    retry: false,
    staleTime: Infinity,
  });

  // Extract result/record UIDs from the first matching record
  const firstRecord = tektonSearch.data?.records?.[0];
  const recordInfo = firstRecord?.name ? parseRecordName(firstRecord.name) : null;
  const resultUid = recordInfo?.resultUid;
  const recordUid = recordInfo?.recordUid;

  // ── Step 3: Fetch decoded PipelineRun from Tekton Results ─────────────────
  const historyPREnabled = k8sNotFound && !!resultUid && !!recordUid;

  const historyPRQuery = useQuery({
    queryKey: ["tektonResults", "unifiedPR", clusterName, namespace, resultUid, recordUid],
    queryFn: () =>
      trpc.tektonResults.getPipelineRun.query({
        namespace,
        resultUid: resultUid!,
        recordUid: recordUid!,
      }),
    enabled: historyPREnabled,
    staleTime: Infinity,
  });

  // ── Step 4: Fetch decoded TaskRun records from Tekton Results ─────────────
  const historyTaskRunsQuery = useQuery({
    queryKey: ["tektonResults", "unifiedTaskRuns", clusterName, namespace, resultUid],
    queryFn: () =>
      trpc.tektonResults.getTaskRunRecords.query({
        namespace,
        resultUid: resultUid!,
      }),
    enabled: historyPREnabled,
    staleTime: Infinity,
  });

  // ── Step 5: Normalize and merge ───────────────────────────────────────────

  // Determine the resolved PipelineRun (live or history)
  const livePipelineRun = pipelineRunWatch.query.data;

  // Memoize normalized history data to avoid re-creating objects on every render.
  // normalizeHistoryPipelineRun/normalizeHistoryTaskRuns return new objects each call.
  const historyPipelineRun = React.useMemo(
    () => (historyPRQuery.data?.pipelineRun ? normalizeHistoryPipelineRun(historyPRQuery.data.pipelineRun) : undefined),
    [historyPRQuery.data?.pipelineRun]
  );

  // The tRPC inferred return type may have subtly different optionality than DecodedTaskRun.
  // The runtime data is identical; we assert through the adapter boundary.
  const historyTaskRuns = React.useMemo(
    () =>
      historyTaskRunsQuery.data?.taskRuns
        ? normalizeHistoryTaskRuns(historyTaskRunsQuery.data.taskRuns as DecodedTaskRun[])
        : undefined,
    [historyTaskRunsQuery.data?.taskRuns]
  );

  const isLive = !!livePipelineRun && !k8sNotFound;
  const isHistory = k8sNotFound && !!historyPipelineRun;

  const resolvedPipelineRun: PipelineRun | undefined = isLive
    ? livePipelineRun
    : isHistory
      ? historyPipelineRun
      : undefined;

  const source: UnifiedSource | null = isLive ? "live" : isHistory ? "history" : null;

  // Extract resultUid from Tekton Results annotation on live PipelineRun.
  // Enables log fallback when pods are GC'd but logs are archived.
  const liveResultAnnotation = livePipelineRun?.metadata?.annotations?.[tektonResultAnnotations.tektonResultRef];
  const liveResultUid =
    isLive && liveResultAnnotation ? (parseResultUidFromAnnotation(liveResultAnnotation) ?? undefined) : undefined;

  // Build the pipeline tasks list (status → spec → childReferences) for details + diagram
  const pipelineRunTasks = React.useMemo(
    () => getPipelineRunTaskGraphDefinitions(resolvedPipelineRun),
    [resolvedPipelineRun]
  );

  // Build the tasks-by-name map
  // For live: use K8s watches. For history: use normalized data (no Task/ApprovalTask defs available).
  const pipelineRunTasksByNameMap = React.useMemo(() => {
    const taskRunsArray: TaskRun[] = isLive ? taskRunsWatch.data.array : (historyTaskRuns ?? []);

    const approvalTasksArray: ApprovalTask[] = isLive ? approvalTasksWatch.data.array : [];

    return buildPipelineRunTasksByNameMap({
      allPipelineTasks: pipelineRunTasks.allTasks,
      tasks: isLive ? tasksWatch.data.array : undefined,
      taskRuns: taskRunsArray,
      approvalTasks: approvalTasksArray,
      pipelineRunName: resolvedPipelineRun?.metadata?.name,
    });
  }, [
    isLive,
    pipelineRunTasks.allTasks,
    resolvedPipelineRun?.metadata?.name,
    tasksWatch.data.array,
    taskRunsWatch.data.array,
    approvalTasksWatch.data.array,
    historyTaskRuns,
  ]);

  // Loading state
  const liveIsLoading =
    !k8sNotFound &&
    [pipelineRunWatch.isLoading, taskRunsWatch.isLoading, tasksWatch.isLoading, approvalTasksWatch.isLoading].some(
      Boolean
    );

  const historyIsLoading =
    k8sNotFound && [tektonSearch.isLoading, historyPRQuery.isLoading, historyTaskRunsQuery.isLoading].some(Boolean);

  const isLoading = [liveIsLoading, historyIsLoading].some(Boolean);
  const isReady = (isLive || isHistory) && !isLoading;

  // Error: only surface when both paths have failed.
  // Wrapped in useMemo to avoid creating a new Error object on every render.
  const historyNotFound = k8sNotFound && tektonSearch.isSuccess && !resultUid;
  const error = React.useMemo<RequestError | Error | null>(
    () => (historyNotFound ? new Error("PipelineRun not found in cluster or Tekton Results history") : null),
    [historyNotFound]
  );

  return React.useMemo(
    () => ({
      pipelineRun: resolvedPipelineRun,
      pipelineRunTasks,
      pipelineRunTasksByNameMap,
      source,
      resultUid: isLive ? liveResultUid : resultUid,
      recordUid,
      isLoading,
      isReady,
      error,
      isK8sNotFound: k8sNotFound,
    }),
    [
      resolvedPipelineRun,
      pipelineRunTasks,
      pipelineRunTasksByNameMap,
      source,
      isLive,
      liveResultUid,
      resultUid,
      recordUid,
      isLoading,
      isReady,
      error,
      k8sNotFound,
    ]
  );
}

/**
 * Same as {@link useUnifiedPipelineRunData}, but reads namespace/name from the pipelinerun details route.
 */
export function useUnifiedPipelineRun(): UnifiedPipelineRunData {
  const params = routePipelineRunDetails.useParams();
  return useUnifiedPipelineRunData({ namespace: params.namespace, name: params.name });
}
