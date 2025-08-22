import {
  createUsePermissionsHook,
  createUseWatchItemHook,
  createUseWatchListHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/utils/hook-creators";
import { ConfigMap, k8sConfigMapConfig } from "@my-project/shared";

export const useConfigMapPermissions = createUsePermissionsHook(k8sConfigMapConfig);
export const useConfigMapWatchList = (params?: UseWatchListParamsWithoutResourceConfig<ConfigMap>) =>
  createUseWatchListHook<ConfigMap>(k8sConfigMapConfig)(params);
export const useConfigMapWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<ConfigMap>) =>
  createUseWatchItemHook<ConfigMap>(k8sConfigMapConfig)(params);
