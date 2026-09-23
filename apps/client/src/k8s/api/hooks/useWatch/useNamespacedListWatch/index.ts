import { useTRPCClient } from "@/core/providers/trpc";
import { useAuth } from "@/core/auth/provider";
import { useWatchRegistries } from "@/core/providers/subscriptions";
import { RequestError } from "@/core/types/global";
import { useClusterStore } from "@/k8s/store";
import { K8sResourceConfig, KubeObjectBase, ResourceLabels } from "@my-project/shared";
import { QueryKey, useQueries, useQueryClient, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { applyWatchEvent, getListSnapshotKey } from "../listCore";
import { getK8sWatchListQueryCacheKey } from "../query-keys";
import { CustomKubeObjectList, k8sListInitialData, WatchEvent } from "../types";
import { ResourceAvailability, useAvailabilityGate } from "../useResourceAvailability";
import { refetchOnWindowFocusIfStale } from "../utils";

export type WatchListQueryOptions<I extends KubeObjectBase> = Omit<
  UseQueryOptions<CustomKubeObjectList<I>, RequestError>,
  "queryKey" | "queryFn" | "initialData" | "placeholderData" | "enabled"
> & {
  /** Gates the watch and capability discovery as well as the queries, so it takes no resolver form. */
  enabled?: boolean;
};

export interface UseNamespacedListWatchParams<I extends KubeObjectBase> {
  resourceConfig: K8sResourceConfig;
  /** Falls back to the store's allowed namespaces. Ignored for cluster-scoped types. */
  namespaces?: string[];
  labels?: ResourceLabels;
  queryOptions?: WatchListQueryOptions<I>;
}

export interface NamespacedListWatch<I extends KubeObjectBase> {
  /** One entry per query; `undefined` is the single cluster-wide query of a cluster-scoped type. */
  namespaces: (string | undefined)[];
  /** Untransformed cache state, index-aligned with `namespaces`. */
  results: UseQueryResult<CustomKubeObjectList<I>, RequestError>[];
  snapshotKey: string;
  availability: ResourceAvailability;
  notServed: boolean;
}

interface WatchTarget {
  id: string;
  queryKey: QueryKey;
  namespace: string | undefined;
}

/** Cache: one untransformed list per namespace under `getK8sWatchListQueryCacheKey`, with watch events applied. */
export const useNamespacedListWatch = <I extends KubeObjectBase>({
  resourceConfig,
  namespaces,
  labels,
  queryOptions,
}: UseNamespacedListWatchParams<I>): NamespacedListWatch<I> => {
  const trpc = useTRPCClient();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { watchListRegistry } = useWatchRegistries();
  const { clusterName, allowedNamespaces } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      allowedNamespaces: state.allowedNamespaces,
    }))
  );

  const callerEnabled = queryOptions?.enabled ?? true;
  const { availability, notServed, isEnabled } = useAvailabilityGate(resourceConfig, callerEnabled);

  // Cluster-scoped types: one cluster-wide query (`null` key).
  // Namespaces are deduped: repeats share a cache key and would double the rows.
  // Keys are serialized so the memos below stay stable across renders with equal input.
  const namespacesKey = resourceConfig.clusterScoped
    ? null
    : JSON.stringify(Array.from(new Set(namespaces ?? allowedNamespaces)));
  const labelsKey = labels ? JSON.stringify(labels) : undefined;

  const resolvedNamespaces = useMemo<(string | undefined)[]>(
    () => (namespacesKey === null ? [undefined] : (JSON.parse(namespacesKey) as string[])),
    [namespacesKey]
  );
  const stableLabels = useMemo<ResourceLabels>(
    () => (labelsKey ? (JSON.parse(labelsKey) as ResourceLabels) : undefined),
    [labelsKey]
  );

  const targets = useMemo<WatchTarget[]>(
    () =>
      resolvedNamespaces.map((namespace) => {
        const queryKey = getK8sWatchListQueryCacheKey(
          clusterName,
          namespace,
          resourceConfig.group,
          resourceConfig.pluralName,
          stableLabels
        );
        return { id: JSON.stringify(queryKey), queryKey, namespace };
      }),
    [resolvedNamespaces, clusterName, resourceConfig.group, resourceConfig.pluralName, stableLabels]
  );

  const results = useQueries({
    queries: targets.map(
      ({ queryKey, namespace }): UseQueryOptions<CustomKubeObjectList<I>, RequestError> => ({
        queryKey,
        queryFn: async () => {
          const list = await trpc.k8s.list.query({
            clusterName,
            resourceConfig,
            namespace,
            labels: stableLabels,
          });

          return {
            apiVersion: list.apiVersion,
            kind: list.kind,
            metadata: list.metadata,
            items: new Map(list.items.map((item) => [item.metadata.name!, item as I])),
          };
        },
        placeholderData: k8sListInitialData as CustomKubeObjectList<I>,
        refetchOnWindowFocus: refetchOnWindowFocusIfStale,
        ...queryOptions,
        // After the spread: an unserved type is never fetched, whatever the caller asked for.
        enabled: isEnabled,
      })
    ),
  });

  // `isSuccess` is also true for a disabled query showing placeholder data, so the gate is checked as well.
  const canWatch = isEnabled && isAuthenticated && !!watchListRegistry;
  // [target id, list resourceVersion] per loaded target. Ids are JSON: no raw newline, safe to join on "\n".
  const loadedVersions: [string, string | undefined][] = canWatch
    ? targets.flatMap(({ id }, index): [string, string | undefined][] => {
        const result = results[index];
        return result?.isSuccess ? [[id, result.data?.metadata?.resourceVersion]] : [];
      })
    : [];
  const watchableKey = loadedVersions.map(([id]) => id).join("\n");
  const resourceVersionsKey = JSON.stringify(loadedVersions);

  // Unregister callbacks by target id. Diffed per target: siblings stay subscribed, equal input is a no-op.
  const registrationsRef = useRef(new Map<string, () => void>());

  // Releases every registration on unmount and on a registry swap; the diff below then registers anew.
  useEffect(() => {
    const registrations = registrationsRef.current;

    return () => {
      registrations.forEach((unregister) => unregister());
      registrations.clear();
    };
  }, [watchListRegistry]);

  useEffect(() => {
    if (!watchListRegistry) return;

    const registrations = registrationsRef.current;
    const wanted = new Set(watchableKey ? watchableKey.split("\n") : []);

    registrations.forEach((unregister, id) => {
      if (wanted.has(id)) return;
      unregister();
      registrations.delete(id);
    });

    targets.forEach(({ id, queryKey, namespace }) => {
      if (!wanted.has(id) || registrations.has(id)) return;

      const onWatchEvent = (event: WatchEvent<I>) => {
        queryClient.setQueryData<CustomKubeObjectList<I>>(queryKey, (list) =>
          list ? applyWatchEvent(list, event) : list
        );
      };

      registrations.set(
        id,
        watchListRegistry.register<I>(
          queryKey,
          { clusterName, namespace, resourceConfig, labels: stableLabels },
          onWatchEvent
        )
      );
    });
  }, [watchableKey, targets, watchListRegistry, queryClient, clusterName, resourceConfig, stableLabels]);

  // Runs on every resourceVersion change so an ended subscription resumes from the latest version;
  // the registry ignores live ones.
  useEffect(() => {
    if (!watchListRegistry) return;

    const resourceVersions = new Map(JSON.parse(resourceVersionsKey) as [string, string | null][]);

    targets.forEach(({ id, queryKey }) => {
      const resourceVersion = resourceVersions.get(id);
      if (resourceVersion) {
        watchListRegistry.startSubscription<I>(queryKey, resourceVersion);
      }
    });
  }, [resourceVersionsKey, targets, watchListRegistry]);

  const snapshotKey = getListSnapshotKey(
    targets.map((target) => target.id),
    results
  );

  return {
    namespaces: resolvedNamespaces,
    results,
    snapshotKey,
    availability,
    notServed,
  };
};
