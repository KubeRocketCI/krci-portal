import { trpc } from "@/core/clients/trpc";
import { useClusterStore } from "@/k8s/store";
import { RequestError } from "@/core/types/global";
import { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";
import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import React, { useEffect, useEffectEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { getK8sWatchItemQueryCacheKey, getK8sWatchListQueryCacheKey } from "../query-keys";
import { watchItemRegistry } from "../registry";
import { UseWatchItemResult, CustomKubeObjectList } from "../types";

type OptionalQueryOptions<I extends KubeObjectBase> = Omit<
  UseQueryOptions<I | undefined, RequestError>,
  "queryKey" | "queryFn" | "initialData" | "placeholderData"
>;

export interface UseWatchItemParams<I extends KubeObjectBase> {
  resourceConfig: K8sResourceConfig;
  name: string | undefined;
  namespace?: string;
  queryOptions?: OptionalQueryOptions<I>;
  /**
   * Optional function to transform/normalize the item data.
   * Applied during queryFn before caching.
   */
  transform?: (item: I) => I;
}

export const useWatchItem = <I extends KubeObjectBase>({
  resourceConfig,
  name,
  namespace,
  queryOptions,
  transform,
}: UseWatchItemParams<I>): UseWatchItemResult<I> => {
  const { clusterName, defaultNamespace: storedNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );
  const _namespace = namespace ?? storedNamespace;
  const queryClient = useQueryClient();

  const queryKey = React.useMemo(
    () => getK8sWatchItemQueryCacheKey(clusterName, _namespace, resourceConfig.pluralName, name),
    [clusterName, _namespace, resourceConfig.pluralName, name]
  );

  const listQueryKey = React.useMemo(
    () => getK8sWatchListQueryCacheKey(clusterName, _namespace, resourceConfig.pluralName),
    [clusterName, _namespace, resourceConfig.pluralName]
  );

  const query = useQuery<I | undefined, RequestError>({
    queryKey,
    queryFn: async () => {
      const data = (await trpc.k8s.get.query({
        resourceConfig,
        clusterName,
        namespace: _namespace,
        name: name!,
      })) as I;

      // Apply transform before caching
      return transform ? transform(data) : data;
    },
    initialData: () => {
      const listData = queryClient.getQueryData<CustomKubeObjectList<I>>(listQueryKey);
      return listData?.items.get(name!) ?? undefined;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: !!name && (queryOptions?.enabled ?? true),
    ...queryOptions,
  });

  // Stable event handler using useEffectEvent
  const onDataUpdate = useEffectEvent((data: I) => {
    queryClient.setQueryData<I>(queryKey, transform ? transform(data) : data);
  });

  // Register subscription and handle WebSocket events
  useEffect(() => {
    if (!name || !query.isSuccess || !query.data) return;

    const params = {
      clusterName,
      namespace: _namespace,
      resourceConfig,
      name,
    };

    const unregister = watchItemRegistry.register<I>(queryKey, params, onDataUpdate);

    // Start subscription with current resourceVersion
    const resourceVersion = query.data.metadata?.resourceVersion;
    if (resourceVersion) {
      watchItemRegistry.startSubscription<I>(queryKey, resourceVersion);
    }

    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    query.isSuccess,
    query.data?.metadata?.resourceVersion,
    name,
    clusterName,
    _namespace,
    resourceConfig.pluralName,
    queryKey,
  ]);

  return {
    data: query.data,
    query,
    resourceVersion: query.data?.metadata?.resourceVersion,
    isLoading: query.isPending,
    isReady: query.isSuccess,
  };
};
