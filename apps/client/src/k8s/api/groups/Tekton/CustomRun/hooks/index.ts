import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/utils/hook-creators";
import { k8sCustomRunConfig, CustomRun } from "@my-project/shared";

export const useCustomRunPermissions = createUsePermissionsHook(k8sCustomRunConfig);
export const useCustomRunWatchList = (params?: UseWatchListParamsWithoutResourceConfig<CustomRun>) =>
  createUseWatchListHook<CustomRun>(k8sCustomRunConfig)(params);
export const useCustomRunWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<CustomRun>) =>
  createUseWatchItemHook<CustomRun>(k8sCustomRunConfig)(params);
