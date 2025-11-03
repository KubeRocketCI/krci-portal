import { trpc } from "@/core/clients/trpc";
import { useClusterStore } from "@/k8s/store";
import { RequestError } from "@/core/types/global";
import { K8sResourceConfig, KubeObjectBase, ResourceLabels } from "@my-project/shared";
import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import React, { useEffect, useMemo, useEffectEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { getK8sWatchListQueryCacheKey } from "../query-keys";
import { watchListRegistry } from "../registry";
import { CustomKubeObjectList, UseWatchListResult, k8sListInitialData, MSG_TYPE } from "../types";

type OptionalQueryOptions<I extends KubeObjectBase> = Omit<
  UseQueryOptions<CustomKubeObjectList<I>, RequestError>,
  "queryKey" | "queryFn" | "initialData" | "placeholderData"
>;

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
  const { clusterName, defaultNamespace: storedNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );
  const _namespace = namespace ?? storedNamespace;
  const queryClient = useQueryClient();

  const queryKey = React.useMemo(
    () => getK8sWatchListQueryCacheKey(clusterName, _namespace, resourceConfig.pluralName, labels),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [_namespace, clusterName, resourceConfig.pluralName, labels ? JSON.stringify(labels) : undefined]
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
    refetchOnWindowFocus: false,
    ...queryOptions,
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
            if (currentVersion < newVersion) {
              newItems.set(name, event.data);
            }
          } else {
            newItems.set(name, event.data);
          }
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
  useEffect(
    () => {
      if (!query.isSuccess) return;

      const params = {
        clusterName,
        namespace: _namespace,
        resourceConfig,
        labels,
      };

      const unregister = watchListRegistry.register<I>(queryKey, params, onWatchEvent);

      // Start subscription with current resourceVersion
      const resourceVersion = query.data.metadata?.resourceVersion;
      if (resourceVersion) {
        watchListRegistry.startSubscription<I>(queryKey, resourceVersion);
      }

      return unregister;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      query.isSuccess,
      query.data?.metadata?.resourceVersion,
      clusterName,
      _namespace,
      resourceConfig.pluralName,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      labels ? JSON.stringify(labels) : undefined,
      queryKey,
    ]
  );

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
    isLoading: query.isPending,
    isReady: query.isSuccess,
    error: query.error,
  };
};
