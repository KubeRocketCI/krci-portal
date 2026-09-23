import { KubeObjectBase } from "@my-project/shared";
import { RequestError } from "@/core/types/global";
import { CustomKubeObjectList, MSG_TYPE, WatchEvent, WatchListMultipleData } from "./types";

/** `UseQueryResult` satisfies it. */
export interface NamespaceListState<I extends KubeObjectBase> {
  data: CustomKubeObjectList<I> | undefined;
  error: RequestError | null;
  isError: boolean;
  isPending: boolean;
  isSuccess: boolean;
  isPlaceholderData: boolean;
  status: string;
  dataUpdatedAt: number;
  errorUpdatedAt: number;
}

export interface ListStatus {
  isLoading: boolean;
  isReady: boolean;
  errors: RequestError[];
}

function isOlderThanCached<I extends KubeObjectBase>(cached: I | undefined, incoming: I): boolean {
  const cachedResourceVersion = cached?.metadata?.resourceVersion;
  if (!cachedResourceVersion) return false;

  return parseInt(cachedResourceVersion, 10) > parseInt(incoming.metadata.resourceVersion ?? "0", 10);
}

/**
 * MODIFIED is dropped only when the cached item is strictly newer; an equal resourceVersion is applied.
 * A dropped MODIFIED, ERROR and unknown event types return `list` unchanged.
 */
export function applyWatchEvent<I extends KubeObjectBase>(
  list: CustomKubeObjectList<I>,
  event: WatchEvent<I>
): CustomKubeObjectList<I> {
  const name = event.data.metadata.name!;
  const items = new Map(list.items);

  switch (event.type) {
    case MSG_TYPE.ADDED:
      items.set(name, event.data);
      break;
    case MSG_TYPE.MODIFIED:
      if (isOlderThanCached(list.items.get(name), event.data)) return list;
      items.set(name, event.data);
      break;
    case MSG_TYPE.DELETED:
      items.delete(name);
      break;
    case MSG_TYPE.ERROR:
      console.error("Error in watch event:", event);
      return list;
    default:
      return list;
  }

  return {
    ...list,
    metadata: {
      ...list.metadata,
      resourceVersion: event.data.metadata.resourceVersion ?? list.metadata.resourceVersion,
    },
    items,
  };
}

/** Errored namespaces contribute nothing. */
export function mergeNamespaceLists<I extends KubeObjectBase>(
  namespaces: readonly (string | undefined)[],
  results: readonly NamespaceListState<I>[],
  transform?: (items: Map<string, I>) => Map<string, I>
): WatchListMultipleData<I> {
  const merged = new Map<string, I>();

  namespaces.forEach((namespace, index) => {
    const result = results[index];
    if (!result || result.isError) return;

    const namespaceKey = namespace ?? "";
    result.data?.items.forEach((item, name) => {
      merged.set(`${namespaceKey}/${name}`, item);
    });
  });

  const map = transform ? transform(merged) : merged;

  return {
    array: Array.from(map.values()),
    map,
  };
}

/** `notServed` settles loading: a disabled query keeps its placeholder forever. */
export function deriveListStatus<I extends KubeObjectBase>(
  results: readonly NamespaceListState<I>[],
  notServed: boolean
): ListStatus {
  const errors = results.flatMap((result) => (result.isError && result.error ? [result.error] : []));

  return {
    isLoading: !notServed && results.some((result) => result.isPending || result.isPlaceholderData),
    isReady: results.every((result) => result.isSuccess && !result.isPlaceholderData),
    errors,
  };
}

/**
 * Changes whenever any query changes data, status or error.
 * `queryIds` make a query-key switch with identical timestamps a new snapshot.
 */
export function getListSnapshotKey<I extends KubeObjectBase>(
  queryIds: readonly string[],
  results: readonly NamespaceListState<I>[]
): string {
  return JSON.stringify(
    queryIds.map((queryId, index) => {
      const result = results[index];
      return [
        queryId,
        result?.status,
        result?.isPlaceholderData,
        result?.data?.metadata?.resourceVersion,
        result?.dataUpdatedAt,
        result?.errorUpdatedAt,
      ];
    })
  );
}
