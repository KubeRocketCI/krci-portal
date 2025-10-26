import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sPipelineConfig, Pipeline } from "@my-project/shared";

export { useCRUD as usePipelineCRUD } from "./useCRUD";

export const usePipelinePermissions = createUsePermissionsHook(k8sPipelineConfig);
export const usePipelineWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Pipeline>) =>
  createUseWatchListHook<Pipeline>(k8sPipelineConfig)(params);
export const usePipelineWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Pipeline>) =>
  createUseWatchItemHook<Pipeline>(k8sPipelineConfig)(params);
