import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/utils/hook-creators";
import { k8sTemplateConfig, Template } from "@my-project/shared";

export const useTemplatePermissions = createUsePermissionsHook(k8sTemplateConfig);
export const useTemplateWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Template>) =>
  createUseWatchListHook<Template>(k8sTemplateConfig)(params);
export const useTemplateWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Template>) =>
  createUseWatchItemHook<Template>(k8sTemplateConfig)(params);
