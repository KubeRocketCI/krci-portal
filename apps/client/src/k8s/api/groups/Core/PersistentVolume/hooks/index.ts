import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sPersistentVolumeConfig, PersistentVolume } from "@my-project/shared";

export const usePersistentVolumePermissions = createUsePermissionsHook(k8sPersistentVolumeConfig);
export const usePersistentVolumeWatchList = (params?: UseWatchListParamsWithoutResourceConfig<PersistentVolume>) =>
  createUseWatchListHook<PersistentVolume>(k8sPersistentVolumeConfig)(params);
export const usePersistentVolumeWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<PersistentVolume>) =>
  createUseWatchItemHook<PersistentVolume>(k8sPersistentVolumeConfig)(params);
