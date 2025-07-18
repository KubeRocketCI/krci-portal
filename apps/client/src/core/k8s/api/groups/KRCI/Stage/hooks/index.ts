import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/core/k8s/api/utils/hook-creators";
import { k8sStageConfig, Stage } from "@my-project/shared";

export const useStagePermissions = createUsePermissionsHook(k8sStageConfig);
export const useStageWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Stage>) =>
  createUseWatchListHook<Stage>(k8sStageConfig)(params);
export const useStageWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Stage>) =>
  createUseWatchItemHook<Stage>(k8sStageConfig)(params);
