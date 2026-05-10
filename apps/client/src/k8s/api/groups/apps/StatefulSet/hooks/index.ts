import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sStatefulSetConfig, StatefulSet } from "@my-project/shared";

export const useStatefulSetPermissions = createUsePermissionsHook(k8sStatefulSetConfig);
export const useStatefulSetWatchList = (params?: UseWatchListParamsWithoutResourceConfig<StatefulSet>) =>
  createUseWatchListHook<StatefulSet>(k8sStatefulSetConfig)(params);
export const useStatefulSetWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<StatefulSet>) =>
  createUseWatchItemHook<StatefulSet>(k8sStatefulSetConfig)(params);
