import { trpc } from "@/core/clients/trpc";
import { useClusterStore } from "@/k8s/store";
import { RequestError } from "@/core/types/global";
import { K8sResourceConfig, KubeObjectBase, ResourceLabels } from "@my-project/shared";
import { useQuery, useQueryClient, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { K8S_DEFAULT_CLUSTER_NAME } from "../../../constants";
import { getK8sWatchListQueryCacheKey } from "../../utils/query-keys";
import { CustomKubeObjectList } from "../watch-types";
import { createListSelectFn } from "../utils/select-helpers";
import { useRegisterListSubscription } from "../utils/watch-registry-effects";
import { getQueryState, mapToArray } from "../utils/query-state-helpers";

type OptionalQueryOptions<I extends KubeObjectBase> = Omit<
  UseQueryOptions<CustomKubeObjectList<I>, RequestError, CustomKubeObjectList<I>>,
  "queryKey" | "queryFn" | "initialData" | "placeholderData" | "select"
>;

export interface UseWatchListParams<I extends KubeObjectBase> {
  resourceConfig: K8sResourceConfig;
  labels?: ResourceLabels;
  namespace?: string;
  queryOptions?: OptionalQueryOptions<I>;
  /**
   * Optional function to transform/normalize the items Map.
   * Applied on every data read (initial load AND WebSocket updates).
   *
   * @example
   * transform: (items) => {
   *   const sorted = Array.from(items.values()).sort(sortFn);
   *   return new Map(sorted.map(item => [item.metadata.name!, item]));
   * }
   */
  transform?: (items: Map<string, I>, listMetadata: CustomKubeObjectList<I>) => Map<string, I>;
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

export const useWatchList = <I extends KubeObjectBase>({
  resourceConfig,
  labels,
  namespace,
  queryOptions,
  transform,
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

  const query = useQuery<CustomKubeObjectList<I>, RequestError>({
    queryKey: k8sWatchListQueryCacheKey,
    queryFn: async () => {
      const data = await trpc.k8s.list.query({
        clusterName,
        resourceConfig,
        namespace: _namespace,
        labels,
      });

      const newResourceVersion = data.metadata?.resourceVersion ?? "0";
      latestResourceVersion.current = newResourceVersion;

      const itemsMap = new Map(data.items.map((item) => [item.metadata.name!, item as I]));

      return {
        apiVersion: data.apiVersion,
        kind: data.kind,
        metadata: data.metadata,
        items: itemsMap,
      };
    },
    select: createListSelectFn(transform),
    placeholderData: k8sListInitialData as CustomKubeObjectList<I>,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

  useRegisterListSubscription<I>(
    k8sWatchListQueryCacheKey,
    { clusterName, namespace: _namespace, resourceConfig, labels },
    queryClient,
    query.isFetched
  );

  const dataMap = query.data?.items || new Map();
  const dataArray = mapToArray(dataMap) as I[];
  const { isReady, isInitialLoading } = getQueryState(query);

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
