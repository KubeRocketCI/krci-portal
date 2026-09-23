import { KubeObjectBase } from "@my-project/shared";
import { UseQueryResult } from "@tanstack/react-query";
import { RequestError } from "@/core/types/global";
import { ResourceAvailability } from "./useResourceAvailability";

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
  availability: ResourceAvailability; // "served" unless the type declares mayBeAbsent
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
  availability: ResourceAvailability; // "served" unless the type declares mayBeAbsent
  error: RequestError | null; // Convenience flag for table components
}

// ============================================================================
// useWatchListMultiple Types
// ============================================================================

export interface WatchListMultipleData<I extends KubeObjectBase> {
  array: I[]; // all items merged
  map: Map<string, I>; // key = "namespace/name"; cluster-scoped: "/name"
}

export interface UseWatchListMultipleResult<I extends KubeObjectBase> {
  data: WatchListMultipleData<I>; // holds every loaded namespace whenever isLoading is false
  errors: RequestError[]; // per-namespace failures; the other namespaces still load
  error: RequestError | null; // Convenience: first per-namespace error, for table components
  isEmpty: boolean;
  isLoading: boolean; // True while any namespace has no data yet; false once the type is not served
  isReady: boolean; // True when every namespace is successfully loaded
  availability: ResourceAvailability; // "served" unless the type declares mayBeAbsent
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
