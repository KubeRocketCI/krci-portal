import { useTRPCClient } from "@/core/providers/trpc";
import { useAuth } from "@/core/auth/provider";
import { useClusterStore } from "@/k8s/store";
import { RequestError } from "@/core/types/global";
import { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";
import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import React, { useEffect, useEffectEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { getK8sWatchItemQueryCacheKey, getK8sWatchListQueryCacheKey } from "../query-keys";
import { useWatchRegistries } from "@/core/providers/subscriptions";
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
  const trpc = useTRPCClient();
  const { isAuthenticated } = useAuth();
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
  // Note: We intentionally do NOT include resourceVersion in dependencies.
  // Kubernetes Watch continues from the initial resourceVersion automatically.
  // Restarting subscriptions on every resourceVersion change causes excessive start/stop cycles.
  const { watchItemRegistry } = useWatchRegistries();

  // Register handler - this should happen as soon as query is successful
  useEffect(() => {
    // Don't register until user is authenticated and registry is available
    if (!name || !query.isSuccess || !query.data || !isAuthenticated || !watchItemRegistry) return;

    const params = {
      clusterName,
      namespace: _namespace,
      resourceConfig,
      name,
    };

    const unregister = watchItemRegistry.register<I>(queryKey, params, onDataUpdate);

    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    query.isSuccess,
    query.data,
    isAuthenticated,
    watchItemRegistry,
    name,
    clusterName,
    _namespace,
    resourceConfig.pluralName,
    queryKey,
  ]);

  // Start subscription once resourceVersion becomes available
  useEffect(() => {
    // Don't start subscriptions until user is authenticated, registry is available, and resourceVersion exists
    if (!name || !query.isSuccess || !query.data || !isAuthenticated || !watchItemRegistry) return;

    const resourceVersion = query.data.metadata?.resourceVersion;
    if (resourceVersion) {
      watchItemRegistry.startSubscription<I>(queryKey, resourceVersion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    query.isSuccess,
    query.data?.metadata?.resourceVersion, // Watch for resourceVersion to become available
    isAuthenticated,
    watchItemRegistry,
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
