import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sTriggerTemplateConfig, TriggerTemplate } from "@my-project/shared";

export const useTriggerTemplatePermissions = createUsePermissionsHook(k8sTriggerTemplateConfig);
export const useTriggerTemplateWatchList = (params?: UseWatchListParamsWithoutResourceConfig<TriggerTemplate>) =>
  createUseWatchListHook<TriggerTemplate>(k8sTriggerTemplateConfig)(params);
export const useTriggerTemplateWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<TriggerTemplate>) =>
  createUseWatchItemHook<TriggerTemplate>(k8sTriggerTemplateConfig)(params);
