import { trpc } from "@/core/clients/trpc";
import { useClusterStore } from "@/k8s/store";
import { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";
import { useQuery, useQueryClient, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { K8S_DEFAULT_CLUSTER_NAME } from "../../../constants";
import { getK8sWatchItemQueryCacheKey, getK8sWatchListQueryCacheKey } from "../../utils/query-keys";
import { CustomKubeObjectList } from "../watch-types";
import { RequestError } from "@/core/types/global";
import { createItemSelectFn } from "../utils/select-helpers";
import { useRegisterItemSubscription } from "../utils/watch-registry-effects";
import { getQueryState } from "../utils/query-state-helpers";

type OptionalQueryOptions<I extends KubeObjectBase> = Omit<
  UseQueryOptions<I, RequestError>,
  "queryKey" | "queryFn" | "initialData" | "placeholderData" | "select"
>;

export interface UseWatchItemParams<I extends KubeObjectBase> {
  resourceConfig: K8sResourceConfig;
  name: string | undefined;
  namespace?: string;
  queryOptions?: OptionalQueryOptions<I>;
  /**
   * Optional function to transform/normalize the item data.
   * Applied on every data read (initial load AND after WebSocket updates).
   */
  transform?: (item: I) => I;
}

export type UseWatchItemResult<I extends KubeObjectBase> = {
  query: UseQueryResult<I | undefined, RequestError>;
  resourceVersion: string | undefined;
  isReady: boolean;
  isInitialLoading: boolean;
};

export const useWatchItem = <I extends KubeObjectBase>({
  resourceConfig,
  name,
  namespace,
  queryOptions,
  transform,
}: UseWatchItemParams<I>) => {
  const clusterName = K8S_DEFAULT_CLUSTER_NAME;
  const storedNamespace = useClusterStore(useShallow((state) => state.defaultNamespace));
  const _namespace = namespace ?? storedNamespace;
  const queryClient = useQueryClient();

  const k8sWatchItemQueryCacheKey = React.useMemo(
    () => getK8sWatchItemQueryCacheKey(clusterName, _namespace, resourceConfig.pluralName, name),
    [clusterName, _namespace, resourceConfig.pluralName, name]
  );
  const k8sWatchListQueryCacheKey = React.useMemo(
    () => getK8sWatchListQueryCacheKey(clusterName, _namespace, resourceConfig.pluralName),
    [clusterName, _namespace, resourceConfig.pluralName]
  );

  const latestResourceVersion = React.useRef<string | null>(null);

  const query = useQuery<I, RequestError>({
    queryKey: k8sWatchItemQueryCacheKey,
    queryFn: async () => {
      const data = (await trpc.k8s.get.query({
        resourceConfig,
        clusterName,
        namespace: _namespace,
        name: name!,
      })) as I;

      const newResourceVersion = data.metadata?.resourceVersion ?? "0";
      latestResourceVersion.current = newResourceVersion;

      return data;
    },
    initialData: () => {
      const listData = queryClient.getQueryData<CustomKubeObjectList<I>>(k8sWatchListQueryCacheKey);
      return listData?.items.get(name!) ?? undefined;
    },
    select: createItemSelectFn(transform),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: !!name && queryOptions?.enabled,
    ...queryOptions,
  });

  useRegisterItemSubscription<I>(
    k8sWatchItemQueryCacheKey,
    name ? { clusterName, namespace: _namespace, resourceConfig, name } : null,
    queryClient,
    query.isFetched
  );

  const { isReady, isInitialLoading } = getQueryState(query);

  return {
    query,
    resourceVersion: latestResourceVersion.current ?? undefined,
    isReady,
    isInitialLoading,
  } satisfies UseWatchItemResult<I>;
};
