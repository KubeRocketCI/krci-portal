import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  createUseWatchListMultipleHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
  UseWatchListMultipleParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { CDPipeline, k8sCDPipelineConfig } from "@my-project/shared";

export { useCRUD as useCDPipelineCRUD } from "./useCRUD";
export * from "./useWatchCDPipelineByAutotest";
export * from "./useWatchCDPipelineByApplication";
export * from "./useWatchCDPipelineByCodebaseBranch";
export * from "./useWatchCDPipelineByStageAutotest";

export const useCDPipelinePermissions = createUsePermissionsHook(k8sCDPipelineConfig);
export const useCDPipelineWatchList = (params?: UseWatchListParamsWithoutResourceConfig<CDPipeline>) =>
  createUseWatchListHook<CDPipeline>(k8sCDPipelineConfig)(params);
export const useCDPipelineWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<CDPipeline>) =>
  createUseWatchItemHook<CDPipeline>(k8sCDPipelineConfig)(params);
export const useCDPipelineWatchListMultiple = (params?: UseWatchListMultipleParamsWithoutResourceConfig<CDPipeline>) =>
  createUseWatchListMultipleHook<CDPipeline>(k8sCDPipelineConfig)(params);
