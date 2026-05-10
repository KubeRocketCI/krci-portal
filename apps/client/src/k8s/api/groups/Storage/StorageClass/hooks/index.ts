import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sStorageClassConfig, StorageClass } from "@my-project/shared";

export const useStorageClassPermissions = createUsePermissionsHook(k8sStorageClassConfig);
export const useStorageClassWatchList = (params?: UseWatchListParamsWithoutResourceConfig<StorageClass>) =>
  createUseWatchListHook<StorageClass>(k8sStorageClassConfig)(params);
export const useStorageClassWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<StorageClass>) =>
  createUseWatchItemHook<StorageClass>(k8sStorageClassConfig)(params);
