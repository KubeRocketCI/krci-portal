import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  createUseWatchListMultipleHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
  UseWatchListMultipleParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sTriggerConfig, Trigger } from "@my-project/shared";

export const useTriggerPermissions = createUsePermissionsHook(k8sTriggerConfig);
export const useTriggerWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Trigger>) =>
  createUseWatchListHook<Trigger>(k8sTriggerConfig)(params);
export const useTriggerWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Trigger>) =>
  createUseWatchItemHook<Trigger>(k8sTriggerConfig)(params);
export const useTriggerWatchListMultiple = (params?: UseWatchListMultipleParamsWithoutResourceConfig<Trigger>) =>
  createUseWatchListMultipleHook<Trigger>(k8sTriggerConfig)(params);
