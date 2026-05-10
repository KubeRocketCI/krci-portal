import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sEventConfig, Event } from "@my-project/shared";

export const useEventPermissions = createUsePermissionsHook(k8sEventConfig);
export const useEventWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Event>) =>
  createUseWatchListHook<Event>(k8sEventConfig)(params);
export const useEventWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Event>) =>
  createUseWatchItemHook<Event>(k8sEventConfig)(params);
