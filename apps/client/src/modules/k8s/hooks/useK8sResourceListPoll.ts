import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { RequestError } from "@/core/types/global";
import type { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";
import { CustomKubeObjectList, UseWatchListResult, k8sListInitialData } from "@/k8s/api/hooks/useWatch/types";
import { getK8sListPollQueryCacheKey } from "@/k8s/api/hooks/useWatch/query-keys";

export interface UseK8sResourceListPollOptions {
  limit?: number;
  fieldSelector?: string;
  refetchInterval?: number;
  enabled?: boolean;
}

/**
 * Polled, bounded list of a K8s resource. Unlike `useK8sResourceList` this opens
 * NO WebSocket watch: it fetches a single page (optionally `limit`-capped and
 * `fieldSelector`-scoped) and refreshes on `refetchInterval`. Use for views that
 * only need a small/scoped slice (e.g. the overview "Recent events" card or a
 * single resource's events) instead of streaming the whole namespace/cluster.
 */
export function useK8sResourceListPoll<T extends KubeObjectBase>(
  config: K8sResourceConfig,
  namespace: string,
  options: UseK8sResourceListPollOptions = {}
): UseWatchListResult<T> {
  const trpc = useTRPCClient();
  const clusterName = useClusterStore((s) => s.clusterName);

  const { limit, fieldSelector, refetchInterval, enabled = true } = options;

  // Cluster-scoped resources carry no namespace; otherwise use the given one. An
  // explicit "" stays cluster-wide on the server. Matches useK8sResourceList: the
  // namespace is always passed by callers, so there is no stored-namespace fallback.
  const _namespace = config.clusterScoped ? undefined : namespace;

  const queryKey = getK8sListPollQueryCacheKey(
    clusterName,
    _namespace,
    config.group,
    config.pluralName,
    fieldSelector,
    limit
  );

  const query = useQuery<CustomKubeObjectList<T>, RequestError>({
    queryKey,
    queryFn: async () => {
      const data = await trpc.k8s.list.query({
        clusterName,
        resourceConfig: config,
        namespace: _namespace,
        limit,
        fieldSelector,
      });

      const itemsMap = new Map(data.items.map((item) => [item.metadata.name!, item as T]));

      return {
        apiVersion: data.apiVersion,
        kind: data.kind,
        metadata: data.metadata,
        items: itemsMap,
      };
    },
    placeholderData: k8sListInitialData as CustomKubeObjectList<T>,
    refetchInterval,
    enabled,
  });

  const data = useMemo(() => {
    const items = query.data?.items ?? new Map<string, T>();
    return {
      array: Array.from(items.values()),
      map: items,
    };
  }, [query.data?.items]);

  return {
    data,
    query,
    resourceVersion: query.data?.metadata?.resourceVersion,
    // Deliberately stricter than useWatchList's `size === 0`: stays false during
    // the placeholder/loading phase so consumers don't flash an empty state.
    isEmpty: !query.isPlaceholderData && (query.data?.items.size ?? 0) === 0,
    // A disabled query never fetches, so it is not "loading" — gate on `enabled`
    // so consumers (e.g. useResourceEvents with no field selector) fall through to
    // their empty state instead of showing a spinner forever.
    isLoading: enabled && (query.isPending || query.isPlaceholderData),
    isReady: query.isSuccess && !query.isPlaceholderData,
    error: query.error,
  };
}
