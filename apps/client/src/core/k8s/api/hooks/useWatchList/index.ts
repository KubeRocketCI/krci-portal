import { trpc } from "@/core/clients/trpc";
import { useClusterStore } from "@/core/store";
import { K8sResourceConfig, KubeObjectBase, KubeObjectListBase, ResourceLabels } from "@my-project/shared";
import { DefinedUseQueryResult, useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { K8S_DEFAULT_CLUSTER_NAME } from "../../../constants";
import { getK8sWatchListQueryCacheKey } from "../../utils/query-keys";

export const MSG_TYPE = {
  ADDED: "ADDED",
  MODIFIED: "MODIFIED",
  DELETED: "DELETED",
  ERROR: "ERROR",
} as const;

export type MsgType = (typeof MSG_TYPE)[keyof typeof MSG_TYPE];

type StreamEvent<T extends KubeObjectBase> = {
  type: MsgType;
  data: T;
};

export type CustomKubeObjectList<T extends KubeObjectBase> = Omit<KubeObjectListBase<T>, "items"> & {
  items: Map<string, T>;
};

export const k8sListInitialData: CustomKubeObjectList<KubeObjectBase> = {
  apiVersion: "",
  kind: "",
  metadata: {} as CustomKubeObjectList<KubeObjectBase>["metadata"],
  items: new Map<string, KubeObjectBase>(),
};

export const mapValuesToArray = <T>(map: Map<string, T>): T[] => {
  return Array.from(map.values());
};

// This is a type that forbids main query options, but allows to pass any other options
type OptionalQueryOptions<I extends KubeObjectBase> = Omit<
  UseQueryOptions<KubeObjectListBase<I> | CustomKubeObjectList<I>, Error, CustomKubeObjectList<I>>,
  "queryKey" | "queryFn" | "initialData" | "placeholderData"
>;

export interface UseWatchListParams<I extends KubeObjectBase> {
  resourceConfig: K8sResourceConfig;
  labels?: ResourceLabels;
  namespace?: string;
  queryOptions?: OptionalQueryOptions<I>;
}

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
    () => getK8sWatchListQueryCacheKey(clusterName, _namespace, resourceConfig.pluralName),
    [_namespace, clusterName, resourceConfig.pluralName]
  );

  const latestResourceVersion = React.useRef<string | null>(null);
  const subscriptionRef = React.useRef<ReturnType<typeof trpc.k8s.watchList.subscribe> | null>(null);

  const query = useQuery<KubeObjectListBase<I> | CustomKubeObjectList<I>, Error, CustomKubeObjectList<I>>({
    queryKey: k8sWatchListQueryCacheKey,
    queryFn: async () => {
      const data: KubeObjectListBase<I> = await trpc.k8s.list.query({
        clusterName,
        resourceConfig,
        namespace: _namespace,
        labels,
      });

      if (!latestResourceVersion.current || latestResourceVersion.current === "0") {
        latestResourceVersion.current = data.metadata?.resourceVersion ?? "0";
      }

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

  React.useEffect(() => {
    if (!query.isFetched || !latestResourceVersion.current || subscriptionRef.current) {
      return;
    }

    subscriptionRef.current = trpc.k8s.watchList.subscribe(
      {
        clusterName,
        resourceConfig,
        namespace: _namespace,
        labels,
        resourceVersion: latestResourceVersion.current,
      },
      {
        onData: (value: { type: string; data?: KubeObjectBase }) => {
          const event = value as StreamEvent<I>;
          if (!event.data?.metadata?.name) return;

          queryClient.setQueryData<CustomKubeObjectList<I>>(k8sWatchListQueryCacheKey, (prevData) => {
            if (!prevData) return prevData;

            const newItems = new Map(prevData.items);
            const messageKubeObject = event.data;
            const name = messageKubeObject.metadata.name;

            switch (value.type) {
              case MSG_TYPE.ADDED:
                newItems.set(name, messageKubeObject);
                break;
              case MSG_TYPE.MODIFIED: {
                const existing = newItems.get(name);
                if (existing && existing.metadata?.resourceVersion) {
                  const currentVersion = parseInt(existing.metadata.resourceVersion, 10);
                  const newVersion = parseInt(messageKubeObject.metadata.resourceVersion ?? "0", 10);
                  if (currentVersion < newVersion) {
                    newItems.set(name, messageKubeObject);
                  }
                } else {
                  newItems.set(name, messageKubeObject);
                }
                break;
              }
              case MSG_TYPE.DELETED:
                newItems.delete(name);
                break;
              case MSG_TYPE.ERROR:
                console.error("Error in update:", event);
                break;
              default:
                console.error("Unknown update type:", event.type);
            }

            // Update resource version for the next reconciliation
            if (messageKubeObject.metadata.resourceVersion) {
              latestResourceVersion.current = messageKubeObject.metadata.resourceVersion;
            }

            return {
              ...prevData,
              items: newItems,
            };
          });
        },
        onError: (error: Error) => console.error("WebSocket error:", error),
      }
    );

    return () => {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [
    query.isFetched,
    clusterName,
    namespace,
    queryClient,
    k8sWatchListQueryCacheKey,
    resourceConfig,
    labels,
    _namespace,
  ]);

  const safeData = query.data || (k8sListInitialData as CustomKubeObjectList<I>);

  return {
    query: {
      ...query,
      data: safeData,
    } as DefinedUseQueryResult<CustomKubeObjectList<I>, Error>,
    dataMap: safeData.items,
    dataArray: mapValuesToArray(safeData.items) as I[],
    isEmpty: safeData.items.size === 0,
  };
};
