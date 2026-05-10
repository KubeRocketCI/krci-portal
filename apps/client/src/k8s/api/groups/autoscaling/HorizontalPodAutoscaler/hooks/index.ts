import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sHorizontalPodAutoscalerConfig, HorizontalPodAutoscaler } from "@my-project/shared";

export const useHorizontalPodAutoscalerPermissions = createUsePermissionsHook(k8sHorizontalPodAutoscalerConfig);
export const useHorizontalPodAutoscalerWatchList = (
  params?: UseWatchListParamsWithoutResourceConfig<HorizontalPodAutoscaler>
) => createUseWatchListHook<HorizontalPodAutoscaler>(k8sHorizontalPodAutoscalerConfig)(params);
export const useHorizontalPodAutoscalerWatchItem = (
  params: UseWatchItemParamsWithoutResourceConfig<HorizontalPodAutoscaler>
) => createUseWatchItemHook<HorizontalPodAutoscaler>(k8sHorizontalPodAutoscalerConfig)(params);
