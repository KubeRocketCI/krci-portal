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
import { watchItemRegistry } from "../../utils/watch-item-subscription-registry";

// This is a type that forbids main query options, but allows to pass any other options
type OptionalQueryOptions<I extends KubeObjectBase> = Omit<
  UseQueryOptions<I, RequestError>,
  "queryKey" | "queryFn" | "initialData" | "placeholderData"
>;

export interface UseWatchItemParams<I extends KubeObjectBase> {
  resourceConfig: K8sResourceConfig;
  name: string | undefined;
  namespace?: string;
  queryOptions?: OptionalQueryOptions<I>;
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
      const data: I = await trpc.k8s.get.query({
        resourceConfig,
        clusterName,
        namespace: _namespace,
        name: name!,
      });

      // Always update to the latest resource version from the API response
      const newResourceVersion = data.metadata?.resourceVersion ?? "0";
      latestResourceVersion.current = newResourceVersion;

      return data;
    },
    initialData: () => {
      const listData = queryClient.getQueryData<CustomKubeObjectList<I>>(k8sWatchListQueryCacheKey);
      return listData?.items.get(name!) ?? undefined;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: !!name && queryOptions?.enabled,
    ...queryOptions,
  });

  // Register with shared item registry
  React.useEffect(() => {
    if (!name) return;

    watchItemRegistry.register<I>(
      k8sWatchItemQueryCacheKey,
      {
        clusterName,
        namespace: _namespace,
        resourceConfig,
        name,
      },
      queryClient
    );

    return () => {
      watchItemRegistry.unregister(k8sWatchItemQueryCacheKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusterName, _namespace, resourceConfig.pluralName, name]);

  // Ensure subscription starts when initial query fetched and resourceVersion is available
  React.useEffect(() => {
    if (query.isFetched) {
      watchItemRegistry.ensureStarted<I>(k8sWatchItemQueryCacheKey, queryClient);
    }
  }, [query.isFetched, k8sWatchItemQueryCacheKey, queryClient]);

  const isReady = query.status === "success" || query.status === "error";
  const isInitialLoading = !query.isFetched && query.isFetching;

  return {
    query,
    resourceVersion: latestResourceVersion.current ?? undefined,
    isReady,
    isInitialLoading,
  } satisfies UseWatchItemResult<I>;
};
