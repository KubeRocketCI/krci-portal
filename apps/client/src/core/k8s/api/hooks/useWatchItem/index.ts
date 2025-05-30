import { trpc } from "@/core/clients/trpc";
import { useClusterStore } from "@/core/store";
import { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";
import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { K8S_DEFAULT_CLUSTER_NAME } from "../../../constants";
import { getK8sWatchItemQueryCacheKey, getK8sWatchListQueryCacheKey } from "../../utils/query-keys";
import { CustomKubeObjectList, MsgType } from "../useWatchList";

type StreamEvent<T extends KubeObjectBase> = {
  type: MsgType;
  data: T;
};

// This is a type that forbids main query options, but allows to pass any other options
type OptionalQueryOptions<I extends KubeObjectBase> = Omit<
  UseQueryOptions<I, Error>,
  "queryKey" | "queryFn" | "initialData" | "placeholderData"
>;

export interface UseWatchItemParams<I extends KubeObjectBase> {
  resourceConfig: K8sResourceConfig;
  name: string | undefined;
  namespace?: string;
  queryOptions?: OptionalQueryOptions<I>;
}

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

  const k8sWatchItemQueryCacheKey = getK8sWatchItemQueryCacheKey(
    clusterName,
    _namespace,
    resourceConfig.pluralName,
    name
  );
  const k8sWatchListQueryCacheKey = getK8sWatchListQueryCacheKey(clusterName, _namespace, resourceConfig.pluralName);

  const latestResourceVersion = React.useRef<string | null>(null);
  const subscriptionRef = React.useRef<ReturnType<typeof trpc.k8s.watchItem.subscribe> | null>(null);

  const query = useQuery<I, Error>({
    queryKey: k8sWatchItemQueryCacheKey,
    queryFn: async () => {
      const data = await trpc.k8s.get.query({
        resourceConfig,
        clusterName,
        namespace: _namespace,
        name: name!,
      });

      if (!latestResourceVersion.current || latestResourceVersion.current === "0") {
        latestResourceVersion.current = data.metadata?.resourceVersion ?? "0";
      }

      return data;
    },
    initialData: () => {
      const initialData = queryClient.getQueryData<CustomKubeObjectList<I>>(k8sWatchListQueryCacheKey);
      return initialData?.items.get(name!) ?? undefined;
    },
    refetchOnWindowFocus: false,
    enabled: !!name && queryOptions?.enabled,
    ...queryOptions,
  });

  React.useEffect(() => {
    if (!query.isFetched || !latestResourceVersion.current || subscriptionRef.current) {
      return;
    }

    subscriptionRef.current = trpc.k8s.watchItem.subscribe(
      {
        resourceConfig,
        clusterName,
        namespace: _namespace,
        resourceVersion: latestResourceVersion.current,
        name: name!,
      },
      {
        onData: (value: { type: string; data: KubeObjectBase }) => {
          const event = value as StreamEvent<I>;
          if (!event.data?.metadata?.uid) return;

          queryClient.setQueryData<I>(k8sWatchItemQueryCacheKey, (prevData) => {
            if (!prevData) return prevData;

            const messageKubeObject = event.data;

            // Update resource version for the next reconciliation
            if (messageKubeObject.metadata.resourceVersion) {
              latestResourceVersion.current = messageKubeObject.metadata.resourceVersion;
            }

            return messageKubeObject;
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
    name,
    k8sWatchItemQueryCacheKey,
    resourceConfig,
    _namespace,
  ]);

  return query;
};
