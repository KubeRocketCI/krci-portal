import { K8sResourceConfig, KubeObjectBase, ResourceLabels } from "@my-project/shared";
import { useMemo } from "react";
import { deriveListStatus, mergeNamespaceLists } from "../listCore";
import { UseWatchListMultipleResult } from "../types";
import { useNamespacedListWatch, WatchListQueryOptions } from "../useNamespacedListWatch";

export interface UseWatchListMultipleParams<I extends KubeObjectBase> {
  resourceConfig: K8sResourceConfig;
  namespaces?: string[]; // Optional, falls back to allowedNamespaces from store
  labels?: ResourceLabels;
  /** Applied to every namespace query. */
  queryOptions?: WatchListQueryOptions<I>;
  /**
   * Receives the merged map (key "namespace/name"). Runs at read time, never cached.
   * Pass a memoized function: a new identity re-derives `data`.
   */
  transform?: (items: Map<string, I>) => Map<string, I>;
}

export const useWatchListMultiple = <I extends KubeObjectBase>({
  resourceConfig,
  namespaces,
  labels,
  queryOptions,
  transform,
}: UseWatchListMultipleParams<I>): UseWatchListMultipleResult<I> => {
  const watch = useNamespacedListWatch<I>({ resourceConfig, namespaces, labels, queryOptions });

  // One memo for data and status: split, `isLoading` could settle a render before the rows.
  const view = useMemo(
    () => ({
      data: mergeNamespaceLists(watch.namespaces, watch.results, transform),
      ...deriveListStatus(watch.results, watch.notServed),
    }),
    // `snapshotKey` covers `namespaces` and `results`; `results` is a new array on every render.
    // Not `useQueries({ combine })`: it returns the previous query set's results for one render after the set changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [watch.snapshotKey, watch.notServed, transform]
  );

  return {
    data: view.data,
    errors: view.errors,
    error: view.errors[0] ?? null,
    isEmpty: view.data.array.length === 0,
    isLoading: view.isLoading,
    isReady: view.isReady,
    availability: watch.availability,
  };
};
