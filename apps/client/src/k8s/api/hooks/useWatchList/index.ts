import { trpc } from "@/core/clients/trpc";
import { useClusterStore } from "@/k8s/store";
import { RequestError } from "@/core/types/global";
import { K8sResourceConfig, KubeObjectBase, KubeObjectListBase, ResourceLabels } from "@my-project/shared";
import { useQuery, useQueryClient, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { K8S_DEFAULT_CLUSTER_NAME } from "../../../constants";
import { getK8sWatchListQueryCacheKey } from "../../utils/query-keys";
import { watchListRegistry } from "../../utils/watch-subscription-registry";
import { CustomKubeObjectList } from "../watch-types";

// This is a type that forbids main query options, but allows to pass any other options
type OptionalQueryOptions<I extends KubeObjectBase> = Omit<
  UseQueryOptions<KubeObjectListBase<I> | CustomKubeObjectList<I>, RequestError, CustomKubeObjectList<I>>,
  "queryKey" | "queryFn" | "initialData" | "placeholderData"
>;

export interface UseWatchListParams<I extends KubeObjectBase> {
  resourceConfig: K8sResourceConfig;
  labels?: ResourceLabels;
  namespace?: string;
  queryOptions?: OptionalQueryOptions<I>;
}

export interface UseWatchListResult<I extends KubeObjectBase> {
  query: UseQueryResult<CustomKubeObjectList<I>, RequestError>;
  dataMap: Map<string, I>;
  dataArray: I[];
  isEmpty: boolean;
  resourceVersion: string | undefined;
  isReady: boolean;
  isInitialLoading: boolean;
}

export const k8sListInitialData: CustomKubeObjectList<KubeObjectBase> = {
  apiVersion: "",
  kind: "",
  metadata: {} as CustomKubeObjectList<KubeObjectBase>["metadata"],
  items: new Map<string, KubeObjectBase>(),
};

export const mapValuesToArray = <T>(map: Map<string, T>): T[] => {
  return Array.from(map.values());
};

export const useWatchList = <I extends KubeObjectBase>({
  resourceConfig,
  labels,
  namespace,
  queryOptions,
}: UseWatchListParams<I>) => {
  const clusterName = K8S_DEFAULT_CLUSTER_NAME;
  const storedNamespace = useClusterStore(useShallow((state) => state.defaultNamespace));
  const _namespace = namespace ?? storedNamespace;
  const queryClient = useQueryClient();

  const k8sWatchListQueryCacheKey = React.useMemo(
    () => getK8sWatchListQueryCacheKey(clusterName, _namespace, resourceConfig.pluralName, labels),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [_namespace, clusterName, resourceConfig.pluralName, labels ? JSON.stringify(labels) : undefined]
  );

  const latestResourceVersion = React.useRef<string | null>(null);

  const query = useQuery<KubeObjectListBase<I> | CustomKubeObjectList<I>, RequestError, CustomKubeObjectList<I>>({
    queryKey: k8sWatchListQueryCacheKey,
    queryFn: async () => {
      const data: KubeObjectListBase<I> = await trpc.k8s.list.query({
        clusterName,
        resourceConfig,
        namespace: _namespace,
        labels,
      });

      // Always update to the latest resource version from the API response
      const newResourceVersion = data.metadata?.resourceVersion ?? "0";
      latestResourceVersion.current = newResourceVersion;

      const resources = data.items.map((item): [string, I] => {
        return [item.metadata.name!, item as I];
      });

      return {
        apiVersion: data.apiVersion,
        kind: data.kind,
        metadata: data.metadata,
        items: new Map(resources),
      };
    },
    placeholderData: k8sListInitialData as CustomKubeObjectList<I>,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

  // Register with shared subscription registry. It will start a subscription when resourceVersion is available.
  React.useEffect(() => {
    watchListRegistry.register<I>(
      k8sWatchListQueryCacheKey,
      {
        clusterName,
        namespace: _namespace,
        resourceConfig,
        labels,
      },
      queryClient
    );

    return () => {
      watchListRegistry.unregister(k8sWatchListQueryCacheKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusterName, _namespace, resourceConfig.pluralName, queryClient, k8sWatchListQueryCacheKey]);

  // Nudge registry to start subscription once the initial query has fetched and has a resourceVersion.
  React.useEffect(() => {
    if (query.isFetched) {
      watchListRegistry.ensureStarted<I>(k8sWatchListQueryCacheKey, queryClient);
    }
  }, [query.isFetched, queryClient, k8sWatchListQueryCacheKey]);

  const dataMap = query.data?.items || new Map();
  const dataArray = mapValuesToArray(dataMap) as I[];
  const isReady = query.status === "success" || query.status === "error";
  const isInitialLoading = !query.isFetched && query.isFetching;

  return {
    query,
    dataMap,
    dataArray,
    isEmpty: query.data?.items.size === 0,
    resourceVersion: query.data?.metadata?.resourceVersion,
    isReady,
    isInitialLoading,
  } satisfies UseWatchListResult<I>;
};
