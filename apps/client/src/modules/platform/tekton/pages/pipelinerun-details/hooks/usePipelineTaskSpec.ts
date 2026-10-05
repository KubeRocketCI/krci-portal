import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { k8sTaskConfig, Task } from "@my-project/shared";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { NamespacedTaskRef, PipelineRunTaskData, TaskSpec } from "./types";
import { isAwaitingTaskSpec } from "./utils";

type TRPCClient = ReturnType<typeof useTRPCClient>;

type PipelineTaskSpecSource = Partial<Pick<PipelineRunTaskData, "taskRun" | "taskSpec" | "pendingTaskRef">>;

export interface PipelineTaskSpecResult {
  taskSpec: TaskSpec | undefined;
  /** A spec is expected and has not arrived yet. */
  isLoading: boolean;
  /** The referenced Task could not be read (404, 403, network). */
  isUnavailable: boolean;
}

const getPipelineTaskSpecQueryKey = (clusterName: string, ref: NamespacedTaskRef | undefined) => [
  "tekton:pipelineTaskSpec",
  clusterName,
  ref?.namespace,
  ref?.name,
];

const fetchTaskSpec = async (trpc: TRPCClient, clusterName: string, ref: NamespacedTaskRef): Promise<TaskSpec> => {
  const task = (await trpc.k8s.get.query({
    clusterName,
    resourceConfig: k8sTaskConfig,
    namespace: ref.namespace,
    name: ref.name,
  })) as Task;

  return task.spec;
};

/**
 * Returns the spec of a pipeline task: the TaskRun snapshot, else the inline spec, else the
 * referenced Task, read by one cached GET.
 *
 * - The GET runs only when `pendingTaskRef` is set, so only for a live task that has not started.
 * - No watch. The cache entry is shared by every run and expires with the QueryClient defaults.
 * - A failed GET is repeated once on each mount, so a transient error clears when the row is expanded again.
 */
export function usePipelineTaskSpec(data: PipelineTaskSpecSource | undefined): PipelineTaskSpecResult {
  const trpc = useTRPCClient();
  const clusterName = useClusterStore((state) => state.clusterName);
  const ref = data?.pendingTaskRef;

  const query = useQuery({
    queryKey: getPipelineTaskSpecQueryKey(clusterName, ref),
    queryFn: ref ? () => fetchTaskSpec(trpc, clusterName, ref) : skipToken,
  });

  if (!ref) {
    return {
      taskSpec: data?.taskSpec,
      isLoading: !!data && isAwaitingTaskSpec(data),
      isUnavailable: false,
    };
  }

  return { taskSpec: query.data, isLoading: query.isPending, isUnavailable: query.isError };
}

/**
 * Returns a function that starts the GET of {@link usePipelineTaskSpec} ahead of a mount.
 * It does nothing for a task without `pendingTaskRef`, for fresh data, and after a failed read.
 */
export function usePrefetchPipelineTaskSpec(): (
  data: Partial<Pick<PipelineRunTaskData, "pendingTaskRef">> | undefined
) => void {
  const trpc = useTRPCClient();
  const clusterName = useClusterStore((state) => state.clusterName);
  const queryClient = useQueryClient();

  return React.useCallback(
    (data) => {
      const ref = data?.pendingTaskRef;
      if (!ref) return;

      const queryKey = getPipelineTaskSpecQueryKey(clusterName, ref);
      if (queryClient.getQueryState(queryKey)?.status === "error") return;

      void queryClient.prefetchQuery({ queryKey, queryFn: () => fetchTaskSpec(trpc, clusterName, ref) });
    },
    [trpc, clusterName, queryClient]
  );
}
