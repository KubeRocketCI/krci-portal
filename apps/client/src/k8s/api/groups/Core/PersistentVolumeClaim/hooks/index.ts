import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sPersistentVolumeClaimConfig, PersistentVolumeClaim } from "@my-project/shared";

export const usePersistentVolumeClaimPermissions = createUsePermissionsHook(k8sPersistentVolumeClaimConfig);
export const usePersistentVolumeClaimWatchList = (
  params?: UseWatchListParamsWithoutResourceConfig<PersistentVolumeClaim>
) => createUseWatchListHook<PersistentVolumeClaim>(k8sPersistentVolumeClaimConfig)(params);
export const usePersistentVolumeClaimWatchItem = (
  params: UseWatchItemParamsWithoutResourceConfig<PersistentVolumeClaim>
) => createUseWatchItemHook<PersistentVolumeClaim>(k8sPersistentVolumeClaimConfig)(params);
