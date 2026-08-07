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
// Component-level deletion conflict checks: codebase-operator validates CodebaseBranch
// deletion but not Codebase deletion, so the referencing CDPipeline is resolved here.
export * from "./useWatchCDPipelineByAutotest";
export * from "./useWatchCDPipelineByApplication";

export const useCDPipelinePermissions = createUsePermissionsHook(k8sCDPipelineConfig);
export const useCDPipelineWatchList = (params?: UseWatchListParamsWithoutResourceConfig<CDPipeline>) =>
  createUseWatchListHook<CDPipeline>(k8sCDPipelineConfig)(params);
export const useCDPipelineWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<CDPipeline>) =>
  createUseWatchItemHook<CDPipeline>(k8sCDPipelineConfig)(params);
export const useCDPipelineWatchListMultiple = (params?: UseWatchListMultipleParamsWithoutResourceConfig<CDPipeline>) =>
  createUseWatchListMultipleHook<CDPipeline>(k8sCDPipelineConfig)(params);
