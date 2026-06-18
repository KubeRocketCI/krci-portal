import { KubeObjectBase } from "@my-project/shared";
import { UseQueryResult } from "@tanstack/react-query";
import { RequestError } from "@/core/types/global";

// ============================================================================
// Common Types
// ============================================================================

export const MSG_TYPE = {
  ADDED: "ADDED",
  MODIFIED: "MODIFIED",
  DELETED: "DELETED",
  ERROR: "ERROR",
} as const;

export type MsgType = (typeof MSG_TYPE)[keyof typeof MSG_TYPE];

export type WatchEvent<T extends KubeObjectBase> = {
  type: MsgType;
  data: T;
};

// ============================================================================
// useWatchItem Types
// ============================================================================

export interface UseWatchItemResult<I extends KubeObjectBase> {
  data: I | undefined;
  query: UseQueryResult<I | undefined, RequestError>;
  resourceVersion: string | undefined;
  isLoading: boolean; // True during initial fetch (no cached data)
  isReady: boolean; // True when data is successfully loaded
}

// ============================================================================
// useWatchList Types
// ============================================================================

export interface WatchListData<I extends KubeObjectBase> {
  array: I[];
  map: Map<string, I>; // key = name
}

export interface UseWatchListResult<I extends KubeObjectBase> {
  data: WatchListData<I>;
  query: UseQueryResult<CustomKubeObjectList<I>, RequestError>;
  resourceVersion: string | undefined;
  isEmpty: boolean;
  isLoading: boolean; // True during initial fetch (no cached data)
  isReady: boolean; // True when data is successfully loaded
  error: RequestError | null; // Convenience flag for table components
}

// ============================================================================
// useWatchListMultiple Types
// ============================================================================

export interface WatchListMultipleData<I extends KubeObjectBase> {
  array: I[]; // all items merged
  map: Map<string, I>; // key = "namespace/name"
  byNamespace: Map<string, WatchListData<I>>; // per-namespace data
}

export interface UseWatchListMultipleResult<I extends KubeObjectBase> {
  data: WatchListMultipleData<I>;
  queries: UseQueryResult<CustomKubeObjectList<I>, RequestError>[];
  query: UseQueryResult<WatchListMultipleData<I>, RequestError>;
  dataVersion: string | undefined;
  errors: RequestError[];
  error: RequestError | null; // Convenience: first per-namespace error, for table components
  isEmpty: boolean;
  isLoading: boolean;
  isReady: boolean;
}

// ============================================================================
// Internal Types
// ============================================================================

export type CustomKubeObjectList<T extends KubeObjectBase> = {
  apiVersion: string;
  kind: string;
  metadata: {
    resourceVersion?: string;
    continue?: string;
    remainingItemCount?: number;
  };
  items: Map<string, T>; // key = name
};

export const k8sListInitialData: CustomKubeObjectList<KubeObjectBase> = {
  apiVersion: "",
  kind: "",
  metadata: {},
  items: new Map<string, KubeObjectBase>(),
};
