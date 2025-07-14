import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/core/k8s/api/utils/hook-creators";
import { k8sPipelineRunConfig, PipelineRun } from "@my-project/shared";

export { useCRUD as usePipelineRunCRUD } from "./useCRUD";
export { useWatchStagePipelineRuns } from "./useWatchStagePipelineRuns";

export const usePipelineRunPermissions = createUsePermissionsHook(k8sPipelineRunConfig);
export const usePipelineRunWatchList = (params?: UseWatchListParamsWithoutResourceConfig<PipelineRun>) =>
  createUseWatchListHook<PipelineRun>(k8sPipelineRunConfig)(params);
export const usePipelineRunWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<PipelineRun>) =>
  createUseWatchItemHook<PipelineRun>(k8sPipelineRunConfig)(params);
