import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sDaemonSetConfig, DaemonSet } from "@my-project/shared";

export const useDaemonSetPermissions = createUsePermissionsHook(k8sDaemonSetConfig);
export const useDaemonSetWatchList = (params?: UseWatchListParamsWithoutResourceConfig<DaemonSet>) =>
  createUseWatchListHook<DaemonSet>(k8sDaemonSetConfig)(params);
export const useDaemonSetWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<DaemonSet>) =>
  createUseWatchItemHook<DaemonSet>(k8sDaemonSetConfig)(params);
