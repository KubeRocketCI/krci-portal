import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  createUseWatchListMultipleHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
  UseWatchListMultipleParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sEventListenerConfig, EventListener } from "@my-project/shared";

export const useEventListenerPermissions = createUsePermissionsHook(k8sEventListenerConfig);
export const useEventListenerWatchList = (params?: UseWatchListParamsWithoutResourceConfig<EventListener>) =>
  createUseWatchListHook<EventListener>(k8sEventListenerConfig)(params);
export const useEventListenerWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<EventListener>) =>
  createUseWatchItemHook<EventListener>(k8sEventListenerConfig)(params);
export const useEventListenerWatchListMultiple = (
  params?: UseWatchListMultipleParamsWithoutResourceConfig<EventListener>
) => createUseWatchListMultipleHook<EventListener>(k8sEventListenerConfig)(params);
