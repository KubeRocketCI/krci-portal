import { useTRPCClient } from "@/core/providers/trpc";
import { useAuth } from "@/core/auth/provider";
import { useClusterStore } from "@/k8s/store";
import { RequestError } from "@/core/types/global";
import { K8sResourceConfig, KubeObjectBase, ResourceLabels } from "@my-project/shared";
import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import React, { useEffect, useMemo, useEffectEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { getK8sWatchListQueryCacheKey } from "../query-keys";
import { useAvailabilityGate } from "../useResourceAvailability";
import { useWatchRegistries } from "@/core/providers/subscriptions";
import { CustomKubeObjectList, UseWatchListResult, k8sListInitialData, MSG_TYPE } from "../types";
import { refetchOnWindowFocusIfStale } from "../utils";

type OptionalQueryOptions<I extends KubeObjectBase> = Omit<
  UseQueryOptions<CustomKubeObjectList<I>, RequestError>,
  "queryKey" | "queryFn" | "initialData" | "placeholderData" | "enabled"
> & {
  /** Gates the watch and capability discovery as well as the query, so it takes no resolver form. */
  enabled?: boolean;
};

export interface UseWatchListParams<I extends KubeObjectBase> {
  resourceConfig: K8sResourceConfig;
  labels?: ResourceLabels;
  namespace?: string;
  queryOptions?: OptionalQueryOptions<I>;
  /**
   * Optional function to transform/normalize the items.
   * Applied during queryFn before caching, and after WebSocket updates.
   */
  transform?: (items: Map<string, I>) => Map<string, I>;
}

export const useWatchList = <I extends KubeObjectBase>({
  resourceConfig,
  labels,
  namespace,
  queryOptions,
  transform,
}: UseWatchListParams<I>): UseWatchListResult<I> => {
  const trpc = useTRPCClient();
  const { isAuthenticated } = useAuth();
  const { clusterName, defaultNamespace: storedNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );
  // For cluster-scoped resources, don't use any namespace
  // Otherwise, use provided namespace or fallback to stored namespace
  const _namespace = resourceConfig.clusterScoped ? undefined : (namespace ?? storedNamespace);
  const queryClient = useQueryClient();

  const callerEnabled = queryOptions?.enabled ?? true;
  const { availability, notServed, isEnabled } = useAvailabilityGate(resourceConfig, callerEnabled);

  const queryKey = React.useMemo(
    () =>
      getK8sWatchListQueryCacheKey(clusterName, _namespace, resourceConfig.group, resourceConfig.pluralName, labels),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      _namespace,
      clusterName,
      resourceConfig.group,
      resourceConfig.pluralName,
      labels ? JSON.stringify(labels) : undefined,
    ]
  );

  const query = useQuery<CustomKubeObjectList<I>, RequestError>({
    queryKey,
    queryFn: async () => {
      const data = await trpc.k8s.list.query({
        clusterName,
        resourceConfig,
        namespace: _namespace,
        labels,
      });

      const itemsMap = new Map(data.items.map((item) => [item.metadata.name!, item as I]));

      // Apply transform before caching
      const transformedItems = transform ? transform(itemsMap) : itemsMap;

      return {
        apiVersion: data.apiVersion,
        kind: data.kind,
        metadata: data.metadata,
        items: transformedItems,
      };
    },
    placeholderData: k8sListInitialData as CustomKubeObjectList<I>,
    refetchOnWindowFocus: refetchOnWindowFocusIfStale,
    ...queryOptions,
    // After the spread: an unserved type is never fetched, whatever the caller asked for.
    enabled: isEnabled,
  });

  // Stable event handler using useEffectEvent
  const onWatchEvent = useEffectEvent((event: { type: string; data: I }) => {
    queryClient.setQueryData<CustomKubeObjectList<I>>(queryKey, (prevData) => {
      if (!prevData) return prevData;

      const newItems = new Map(prevData.items);
      const name = event.data.metadata.name!;

      switch (event.type) {
        case MSG_TYPE.ADDED:
          newItems.set(name, event.data);
          break;
        case MSG_TYPE.MODIFIED: {
          const existing = newItems.get(name);
          if (existing?.metadata?.resourceVersion) {
            const currentVersion = parseInt(existing.metadata.resourceVersion, 10);
            const newVersion = parseInt(event.data.metadata.resourceVersion ?? "0", 10);

            if (currentVersion > newVersion) {
              break;
            }
          }
          newItems.set(name, event.data);
          break;
        }
        case MSG_TYPE.DELETED:
          newItems.delete(name);
          break;
        case MSG_TYPE.ERROR:
          console.error("Error in watch event:", event);
          break;
      }

      // Apply transform after WebSocket update
      const transformedItems = transform ? transform(newItems) : newItems;

      return {
        ...prevData,
        metadata: {
          ...prevData.metadata,
          resourceVersion: event.data.metadata.resourceVersion ?? prevData.metadata.resourceVersion,
        },
        items: transformedItems,
      };
    });
  });

  // Register subscription and handle WebSocket events
  // Note: We intentionally do NOT include resourceVersion in dependencies.
  // Kubernetes Watch continues from the initial resourceVersion automatically.
  // Restarting subscriptions on every resourceVersion change causes excessive start/stop cycles.
  const { watchListRegistry } = useWatchRegistries();

  // Register handler as soon as the query is successful. `isSuccess` is also true for a
  // disabled query showing placeholder data, so the gate is checked as well.
  useEffect(
    () => {
      if (!isEnabled || !query.isSuccess || !isAuthenticated || !watchListRegistry) return;

      const params = {
        clusterName,
        namespace: _namespace,
        resourceConfig,
        labels,
      };

      const unregister = watchListRegistry.register<I>(queryKey, params, onWatchEvent);

      return unregister;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isEnabled,
      query.isSuccess,
      isAuthenticated,
      watchListRegistry,
      clusterName,
      _namespace,
      resourceConfig.pluralName,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      labels ? JSON.stringify(labels) : undefined,
      queryKey,
    ]
  );

  // Start subscription once resourceVersion becomes available
  useEffect(() => {
    if (!isEnabled || !query.isSuccess || !isAuthenticated || !watchListRegistry) return;

    const resourceVersion = query.data?.metadata?.resourceVersion;
    if (resourceVersion) {
      watchListRegistry.startSubscription<I>(queryKey, resourceVersion);
    }
  }, [
    isEnabled,
    query.isSuccess,
    query.data?.metadata?.resourceVersion, // Watch for resourceVersion to become available
    isAuthenticated,
    watchListRegistry,
    clusterName,
    _namespace,
    resourceConfig.pluralName,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    labels ? JSON.stringify(labels) : undefined,
    queryKey,
  ]);

  // Derive data structure
  const data = useMemo(() => {
    const items = query.data?.items || new Map();
    return {
      array: Array.from(items.values()),
      map: items,
    };
  }, [query.data?.items]);

  return {
    data,
    query,
    resourceVersion: query.data?.metadata?.resourceVersion,
    isEmpty: query.data?.items.size === 0,
    // An unserved type has settled: a disabled query keeps showing placeholder data,
    // which would otherwise read as a permanent loading state.
    isLoading: notServed ? false : query.isPending || query.isPlaceholderData,
    isReady: query.isSuccess && !query.isPlaceholderData,
    availability,
    error: query.error,
  };
};
