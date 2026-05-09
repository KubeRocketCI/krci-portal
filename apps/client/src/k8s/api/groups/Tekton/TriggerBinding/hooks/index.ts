import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sTriggerBindingConfig, TriggerBinding } from "@my-project/shared";

export const useTriggerBindingPermissions = createUsePermissionsHook(k8sTriggerBindingConfig);
export const useTriggerBindingWatchList = (params?: UseWatchListParamsWithoutResourceConfig<TriggerBinding>) =>
  createUseWatchListHook<TriggerBinding>(k8sTriggerBindingConfig)(params);
export const useTriggerBindingWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<TriggerBinding>) =>
  createUseWatchItemHook<TriggerBinding>(k8sTriggerBindingConfig)(params);
