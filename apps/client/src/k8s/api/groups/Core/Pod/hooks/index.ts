import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sPodConfig, Pod } from "@my-project/shared";

export const usePodPermissions = createUsePermissionsHook(k8sPodConfig);
export const usePodWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Pod>) =>
  createUseWatchListHook<Pod>(k8sPodConfig)(params);
export const usePodWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Pod>) =>
  createUseWatchItemHook<Pod>(k8sPodConfig)(params);
