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
import { UseWatchItemResult, CustomKubeObjectList, MSG_TYPE, WatchEvent } from "../types";
import { refetchOnWindowFocusIfStale } from "../utils";
import { createK8sNotFoundError, isK8sNotFoundError } from "@/k8s/api/utils/k8sNotFoundError";

type OptionalQueryOptions<I extends KubeObjectBase> = Omit<
  UseQueryOptions<I | undefined, RequestError>,
  "queryKey" | "queryFn" | "initialData" | "placeholderData" | "enabled"
> & {
  /** Gates the watch as well as the query, so it takes no resolver form. */
  enabled?: boolean;
};

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
  // For cluster-scoped resources, don't use any namespace
  // Otherwise, use provided namespace or fallback to stored namespace
  const _namespace = resourceConfig.clusterScoped ? undefined : (namespace ?? storedNamespace);
  const queryClient = useQueryClient();

  const queryKey = React.useMemo(
    () => getK8sWatchItemQueryCacheKey(clusterName, _namespace, resourceConfig.group, resourceConfig.pluralName, name),
    [clusterName, _namespace, resourceConfig.group, resourceConfig.pluralName, name]
  );

  const listQueryKey = React.useMemo(
    () => getK8sWatchListQueryCacheKey(clusterName, _namespace, resourceConfig.group, resourceConfig.pluralName),
    [clusterName, _namespace, resourceConfig.group, resourceConfig.pluralName]
  );

  const isEnabled = !!name && (queryOptions?.enabled ?? true);

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
    initialDataUpdatedAt: () => {
      const state = queryClient.getQueryState<CustomKubeObjectList<I>>(listQueryKey);
      return state?.dataUpdatedAt;
    },
    refetchOnWindowFocus: refetchOnWindowFocusIfStale,
    refetchOnMount: false,
    refetchOnReconnect: false,
    ...queryOptions,
    // After the spread: a GET needs a name whatever the caller asked for.
    enabled: isEnabled,
  });

  // Stable event handler using useEffectEvent
  const onWatchEvent = useEffectEvent((event: WatchEvent<I>) => {
    if (event.type === MSG_TYPE.DELETED) {
      // The list cache seeds `initialData`. Leaving the entry there re-seeds the
      // deleted object on the next mount.
      queryClient.setQueryData<CustomKubeObjectList<I>>(listQueryKey, (listData) => {
        if (!listData?.items.has(name!)) return listData;

        const items = new Map(listData.items);
        items.delete(name!);
        return { ...listData, items };
      });
      // A GET already in flight resolves after this write and would restore the object.
      // Silent, so the cancellation itself reaches no caller.
      queryClient.cancelQueries({ queryKey, exact: true }, { revert: false, silent: true });
      // Settle on the state a name that never existed reaches. Callers read `error` to
      // tell gone from loading, and `setQueryData` cannot clear data: it reads
      // `undefined` as "no change".
      queryClient
        .getQueryCache()
        .find<I | undefined, RequestError>({ queryKey, exact: true })
        ?.setState({
          status: "error",
          error: createK8sNotFoundError(`${resourceConfig.pluralName} "${name}" not found`),
          data: undefined,
          // No data, so no time it is current as of. Keeping the old stamp would read as
          // fresh and disarm the focus refetch that covers a dead socket.
          dataUpdatedAt: 0,
          errorUpdatedAt: Date.now(),
          fetchStatus: "idle",
        });
      return;
    }

    queryClient.setQueryData<I>(queryKey, transform ? transform(event.data) : event.data);
  });

  const { watchItemRegistry } = useWatchRegistries();

  // A 404 settles the query as well. The object may still be created while the page is
  // open, and the watch is the only way to see it appear.
  const hasSettled = query.isSuccess || isK8sNotFoundError(query.error);

  // Register handler - this should happen as soon as the query settles.
  // Note: the item itself is NOT a dependency. Re-registering on every event tears the
  // subscription down and opens a new one for each update.
  useEffect(() => {
    if (!isEnabled || !name || !hasSettled || !isAuthenticated || !watchItemRegistry) return;

    const params = {
      clusterName,
      namespace: _namespace,
      resourceConfig,
      name,
    };

    const unregister = watchItemRegistry.register<I>(queryKey, params, onWatchEvent);

    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isEnabled,
    hasSettled,
    isAuthenticated,
    watchItemRegistry,
    name,
    clusterName,
    _namespace,
    resourceConfig.pluralName,
    queryKey,
  ]);

  // Start subscription once the query settles.
  // Note: resourceVersion is a dependency only so an absent object upgrades to its own
  // version once created. An already running subscription is reused, never restarted.
  useEffect(() => {
    if (!isEnabled || !name || !hasSettled || !isAuthenticated || !watchItemRegistry) return;

    // An empty resourceVersion starts the watch from the current state, so an object
    // that does not exist yet is still observed until it is created.
    watchItemRegistry.startSubscription<I>(queryKey, query.data?.metadata?.resourceVersion ?? "");
  }, [
    isEnabled,
    hasSettled,
    query.data?.metadata?.resourceVersion,
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
