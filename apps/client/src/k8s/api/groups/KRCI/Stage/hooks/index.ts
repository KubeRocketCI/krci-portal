import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sStageConfig, Stage } from "@my-project/shared";

export { useCRUD as useStageCRUD } from "./useCRUD";

export const useStagePermissions = createUsePermissionsHook(k8sStageConfig);
export const useStageWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Stage>) =>
  createUseWatchListHook<Stage>(k8sStageConfig)(params);
export const useStageWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Stage>) =>
  createUseWatchItemHook<Stage>(k8sStageConfig)(params);
