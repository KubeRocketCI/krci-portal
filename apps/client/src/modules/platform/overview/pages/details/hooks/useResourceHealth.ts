import { useCDPipelineWatchList } from "@/k8s/api/groups/KRCI/CDPipeline";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { useCodebaseBranchWatchList } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { useStageWatchList } from "@/k8s/api/groups/KRCI/Stage";
import type { UseWatchListResult } from "@/k8s/api/hooks/useWatch/types";
import type { KubeObjectBase } from "@my-project/shared";
import React from "react";
import { countKrciStatuses } from "../utils/countKrciStatuses";
import { RESOURCE_HEALTH_LOADING, type LoadedResourceHealth, type ResourceHealthData } from "../utils/statusSegments";

/**
 * Use isLoading, not query.isFetching. A background refetch keeps the counts.
 * A failed first fetch has no data. It stays unloaded so the tile shows the error.
 */
export function useResourceHealth<T extends KubeObjectBase>(
  useWatchList: () => UseWatchListResult<T>,
  count: (items: readonly T[]) => LoadedResourceHealth
) {
  const { data, query, isLoading, error } = useWatchList();

  const counts = React.useMemo<ResourceHealthData>(
    () => (isLoading || !query.data ? RESOURCE_HEALTH_LOADING : count(data.array)),
    [data.array, query.data, isLoading, count]
  );

  return { counts, isLoading, error };
}

export const useCodebasesHealth = () => useResourceHealth(useCodebaseWatchList, countKrciStatuses);
export const useCodebaseBranchesHealth = () => useResourceHealth(useCodebaseBranchWatchList, countKrciStatuses);
export const useCDPipelinesHealth = () => useResourceHealth(useCDPipelineWatchList, countKrciStatuses);
export const useStagesHealth = () => useResourceHealth(useStageWatchList, countKrciStatuses);
