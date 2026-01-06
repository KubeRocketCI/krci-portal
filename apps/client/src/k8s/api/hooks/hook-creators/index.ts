import { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";
import { usePermissions } from "../usePermissions";
import { useWatchItem, UseWatchItemParams } from "../useWatch/useWatchItem";
import { useWatchList, UseWatchListParams } from "../useWatch/useWatchList";
import { useWatchListMultiple, UseWatchListMultipleParams } from "../useWatch/useWatchListMultiple";

// Omit resourceConfig from params since it's provided by the factory
export type UseWatchItemParamsWithoutResourceConfig<I extends KubeObjectBase> = Omit<
  UseWatchItemParams<I>,
  "resourceConfig"
>;

export type UseWatchListParamsWithoutResourceConfig<I extends KubeObjectBase> = Omit<
  UseWatchListParams<I>,
  "resourceConfig"
>;

export type UseWatchListMultipleParamsWithoutResourceConfig<I extends KubeObjectBase> = Omit<
  UseWatchListMultipleParams<I>,
  "resourceConfig"
>;

// Functions are declared (not const assigned) to avoid TDZ issues when modules
// participate in circular imports.
export function createUsePermissionsHook(k8sResourceConfig: K8sResourceConfig) {
  return () =>
    usePermissions({
      group: k8sResourceConfig.group,
      version: k8sResourceConfig.version,
      resourcePlural: k8sResourceConfig.pluralName,
    });
}

/**
 * Creates a useWatchItem hook bound to a specific resource config
 */
export function createUseWatchItemHook<I extends KubeObjectBase>(resourceConfig: K8sResourceConfig) {
  return (params: UseWatchItemParamsWithoutResourceConfig<I>) => useWatchItem<I>({ resourceConfig, ...params });
}

/**
 * Creates a useWatchList hook bound to a specific resource config
 */
export function createUseWatchListHook<I extends KubeObjectBase>(resourceConfig: K8sResourceConfig) {
  return (params?: UseWatchListParamsWithoutResourceConfig<I>) => useWatchList<I>({ resourceConfig, ...params });
}

/**
 * Creates a useWatchListMultiple hook bound to a specific resource config
 */
export function createUseWatchListMultipleHook<I extends KubeObjectBase>(resourceConfig: K8sResourceConfig) {
  return (params?: UseWatchListMultipleParamsWithoutResourceConfig<I>) =>
    useWatchListMultiple<I>({ resourceConfig, ...params });
}
