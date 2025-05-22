import { KubeObjectBase } from "@my-project/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { CustomKubeObjectList, MsgType } from "../useWatchList";
import { getK8sWatchItemQueryCacheKey, getK8sWatchListQueryCacheKey } from "../../query-keys";
import { trpc } from "@/core/clients/trpc";

type StreamEvent<T extends KubeObjectBase> = {
  type: MsgType;
  data: T;
};

export const useWatchItem = <I extends KubeObjectBase>({
  clusterName,
  group,
  version,
  namespace,
  resourcePlural,
  name,
}: {
  clusterName: string;
  group: string;
  version: string;
  namespace: string;
  resourcePlural: string;
  name: string;
}) => {
  const queryClient = useQueryClient();

  const k8sWatchItemQueryCacheKey = getK8sWatchItemQueryCacheKey(clusterName, namespace, resourcePlural, name);
  const k8sWatchListQueryCacheKey = getK8sWatchListQueryCacheKey(clusterName, namespace, resourcePlural);

  const latestResourceVersion = React.useRef<string | null>(null);
  const subscriptionRef = React.useRef<ReturnType<typeof trpc.k8s.watchItem.subscribe> | null>(null);

  const query = useQuery<I, Error>({
    queryKey: k8sWatchItemQueryCacheKey,
    queryFn: async () => {
      const data = await trpc.k8s.list.query({
        clusterName,
        group,
        version,
        namespace,
        resourcePlural,
      });

      if (!latestResourceVersion.current || latestResourceVersion.current === "0") {
        latestResourceVersion.current = data.metadata?.resourceVersion ?? "0";
      }

      return data;
    },
    initialData: () => {
      const initialData = queryClient.getQueryData<CustomKubeObjectList<I>>(k8sWatchListQueryCacheKey);
      return initialData?.items.get(name) ?? undefined;
    },
    refetchOnWindowFocus: false,
  });

  React.useEffect(() => {
    if (!query.isFetched || !latestResourceVersion.current || subscriptionRef.current) {
      return;
    }

    subscriptionRef.current = trpc.k8s.watchItem.subscribe(
      {
        clusterName,
        group,
        version,
        namespace,
        resourcePlural,
        resourceVersion: latestResourceVersion.current,
        name,
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
    resourcePlural,
    queryClient,
    group,
    version,
    name,
    k8sWatchItemQueryCacheKey,
  ]);

  return query;
};
