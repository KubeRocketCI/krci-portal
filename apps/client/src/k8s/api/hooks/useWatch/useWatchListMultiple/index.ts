import { useTRPCClient } from "@/core/providers/trpc";
import { useAuth } from "@/core/auth/provider";
import { useClusterStore } from "@/k8s/store";
import { RequestError } from "@/core/types/global";
import { K8sResourceConfig, KubeObjectBase, ResourceLabels } from "@my-project/shared";
import { useQueries, useQuery, useQueryClient, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import { useEffect, useEffectEvent, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { getK8sWatchListQueryCacheKey } from "../query-keys";
import { useWatchRegistries } from "@/core/providers/subscriptions";
import {
  CustomKubeObjectList,
  UseWatchListMultipleResult,
  k8sListInitialData,
  MSG_TYPE,
  WatchListMultipleData,
  WatchListData,
} from "../types";

type OptionalQueryOptions<I extends KubeObjectBase> = Omit<
  UseQueryOptions<WatchListMultipleData<I>, RequestError>,
  "queryKey" | "queryFn" | "initialData" | "placeholderData" | "enabled"
>;

export interface UseWatchListMultipleParams<I extends KubeObjectBase> {
  resourceConfig: K8sResourceConfig;
  namespaces?: string[]; // Optional, falls back to allowedNamespaces from store
  labels?: ResourceLabels;
  queryOptions?: OptionalQueryOptions<I>;
  /**
   * Optional function to transform/normalize the merged items.
   * Applied after merging all namespace data.
   */
  transform?: (items: Map<string, I>) => Map<string, I>;
}

// Helper to create a stable query key for the combined query
const getCombinedQueryKey = (
  clusterName: string,
  resourcePluralName: string,
  namespaces: string[],
  labels?: ResourceLabels
) => {
  return [
    "k8s-watch-list-multiple",
    clusterName,
    resourcePluralName,
    namespaces.sort().join(","),
    labels ? JSON.stringify(labels) : undefined,
  ].filter(Boolean);
};

export const useWatchListMultiple = <I extends KubeObjectBase>({
  resourceConfig,
  namespaces,
  labels,
  queryOptions,
  transform,
}: UseWatchListMultipleParams<I>): UseWatchListMultipleResult<I> => {
  const trpc = useTRPCClient();
  const { isAuthenticated } = useAuth();
  const { clusterName, allowedNamespaces } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      allowedNamespaces: state.allowedNamespaces,
    }))
  );
  const queryClient = useQueryClient();

  // Use provided namespaces or fall back to allowedNamespaces from store
  const _namespaces = namespaces ?? allowedNamespaces;

  // Stable reference for namespaces array
  const namespacesKey = useMemo(
    () => _namespaces.join(","),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [_namespaces.join(",")]
  );

  // Stable reference for labels
  const labelsKey = useMemo(
    () => (labels ? JSON.stringify(labels) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labels ? JSON.stringify(labels) : undefined]
  );

  // Generate query keys for all namespaces
  const namespaceQueryKeys = useMemo(
    () => _namespaces.map((ns) => getK8sWatchListQueryCacheKey(clusterName, ns, resourceConfig.pluralName, labels)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clusterName, namespacesKey, resourceConfig.pluralName, labelsKey]
  );

  // Create individual queries for each namespace
  const namespaceQueries = useQueries({
    queries: _namespaces.map((ns, index) => ({
      queryKey: namespaceQueryKeys[index],
      queryFn: async (): Promise<CustomKubeObjectList<I>> => {
        const data = await trpc.k8s.list.query({
          clusterName,
          resourceConfig,
          namespace: ns,
          labels,
        });

        const itemsMap = new Map(data.items.map((item) => [item.metadata.name!, item as I]));

        return {
          apiVersion: data.apiVersion,
          kind: data.kind,
          metadata: data.metadata,
          items: itemsMap,
        };
      },
      placeholderData: k8sListInitialData as CustomKubeObjectList<I>,
      refetchOnWindowFocus: false,
    })),
  }) as UseQueryResult<CustomKubeObjectList<I>, RequestError>[];

  // Stable references for dependency tracking
  // Note: We intentionally do NOT include resourceVersion in querySuccessStates.
  // Kubernetes Watch continues from the initial resourceVersion automatically.
  // Restarting subscriptions on every resourceVersion change causes excessive start/stop cycles.
  const querySuccessStates = namespaceQueries
    .map((q) => `${q.isSuccess}-${q.data?.metadata?.resourceVersion}`)
    .join(",");
  const namespaceQueryKeysKey = namespaceQueryKeys.map((k) => JSON.stringify(k)).join(",");

  // Stable event handler using useEffectEvent
  const onWatchEvent = useEffectEvent((queryKey: unknown[], event: { type: string; data: I }) => {
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

      return {
        ...prevData,
        metadata: {
          ...prevData.metadata,
          resourceVersion: event.data.metadata.resourceVersion ?? prevData.metadata.resourceVersion,
        },
        items: newItems,
      };
    });
  });

  // Register subscriptions for each namespace
  const { watchListRegistry } = useWatchRegistries();

  useEffect(() => {
    // Don't start subscriptions until user is authenticated and registry is available
    if (!isAuthenticated || !watchListRegistry) return;

    const unregisterFns: (() => void)[] = [];

    namespaceQueries.forEach((query, index) => {
      if (!query.isSuccess) return;

      const ns = _namespaces[index];
      const queryKey = namespaceQueryKeys[index];

      const params = {
        clusterName,
        namespace: ns,
        resourceConfig,
        labels,
      };

      const unregister = watchListRegistry.register<I>(queryKey, params, (event: { type: string; data: I }) =>
        onWatchEvent(queryKey, event)
      );

      unregisterFns.push(unregister);

      // Start subscription with current resourceVersion
      const resourceVersion = query.data?.metadata?.resourceVersion;
      if (resourceVersion) {
        watchListRegistry.startSubscription<I>(queryKey, resourceVersion);
      }
    });

    return () => {
      unregisterFns.forEach((fn) => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isAuthenticated,
    watchListRegistry, // Include registry to ensure effect runs when it becomes available
    querySuccessStates,
    clusterName,
    namespacesKey,
    resourceConfig.pluralName,
    labelsKey,
    namespaceQueryKeysKey,
  ]);

  // Combined query key
  const combinedQueryKey = useMemo(
    () => getCombinedQueryKey(clusterName, resourceConfig.pluralName, _namespaces, labels),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clusterName, resourceConfig.pluralName, namespacesKey, labelsKey]
  );

  // Stable reference for error states
  const errorStatesKey = namespaceQueries.map((q) => q.isError).join(",");

  // Stable reference for success states to track when queries complete
  const successStatesKey = namespaceQueries.map((q) => q.isSuccess).join(",");

  // Create a real useQuery that will hold the combined data
  const combinedQuery = useQuery<WatchListMultipleData<I>, RequestError>({
    queryKey: combinedQueryKey,
    queryFn: async () => {
      // This won't actually be called since we use placeholderData and manual updates
      throw new Error("Combined query should never fetch - data is derived from namespace queries");
    },
    enabled: false, // Never fetch, we'll update manually
    placeholderData: { array: [], map: new Map(), byNamespace: new Map() },
    refetchOnWindowFocus: queryOptions?.refetchOnWindowFocus ?? false,
    refetchOnMount: queryOptions?.refetchOnMount ?? false,
    refetchOnReconnect: queryOptions?.refetchOnReconnect ?? false,
    gcTime: queryOptions?.gcTime,
    staleTime: queryOptions?.staleTime,
  });

  // Update combined query data whenever namespace queries change
  useEffect(() => {
    const mergedMap = new Map<string, I>();
    const byNamespace = new Map<string, WatchListData<I>>();

    _namespaces.forEach((ns, index) => {
      const query = namespaceQueries[index];

      if (query.isError && query.error) {
        byNamespace.set(ns, { array: [], map: new Map() });
        return;
      }

      const items = query.data?.items || new Map<string, I>();
      const itemsArray = Array.from(items.values());

      byNamespace.set(ns, {
        array: itemsArray,
        map: items,
      });

      items.forEach((item: I, name: string) => {
        mergedMap.set(`${ns}/${name}`, item);
      });
    });

    const transformedMap = transform ? transform(mergedMap) : mergedMap;

    const combinedData: WatchListMultipleData<I> = {
      array: Array.from(transformedMap.values()),
      map: transformedMap,
      byNamespace,
    };

    // Manually update the query data
    queryClient.setQueryData<WatchListMultipleData<I>>(combinedQueryKey, combinedData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespacesKey, querySuccessStates, successStatesKey, errorStatesKey]);

  // Calculate dataVersion (max resourceVersion across all namespaces)
  const dataVersion = useMemo(() => {
    return namespaceQueries.map((q) => q.data?.metadata?.resourceVersion).join(",");
  }, [namespaceQueries]);

  // Derive errors map
  const errors = useMemo(() => {
    return namespaceQueries.filter((q) => q.isError && q.error).map((q) => q.error) as RequestError[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespacesKey, errorStatesKey]);

  // Calculate loading and ready states
  const isLoading = useMemo(() => {
    return namespaceQueries.some((q) => q.isPending);
  }, [namespaceQueries]);

  const isReady = useMemo(() => {
    return namespaceQueries.every((q) => q.isSuccess);
  }, [namespaceQueries]);

  return {
    data: combinedQuery.data ?? { array: [], map: new Map(), byNamespace: new Map() },
    queries: namespaceQueries,
    query: combinedQuery,
    dataVersion,
    errors,
    isEmpty: (combinedQuery.data?.array.length ?? 0) === 0,
    isLoading,
    isReady,
  };
};
