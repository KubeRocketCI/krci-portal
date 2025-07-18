import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/core/k8s/api/utils/hook-creators";
import { CDPipeline, k8sCDPipelineConfig } from "@my-project/shared";

export * from "./useWatchCDPipelineByAutotest";
export * from "./useWatchCDPipelineByApplication";
export * from "./useWatchCDPipelineByCodebaseBranch";
export * from "./useWatchCDPipelineByStageAutotest";

export const useCDPipelinePermissions = createUsePermissionsHook(k8sCDPipelineConfig);
export const useCDPipelineWatchList = (params?: UseWatchListParamsWithoutResourceConfig<CDPipeline>) =>
  createUseWatchListHook<CDPipeline>(k8sCDPipelineConfig)(params);
export const useCDPipelineWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<CDPipeline>) =>
  createUseWatchItemHook<CDPipeline>(k8sCDPipelineConfig)(params);
