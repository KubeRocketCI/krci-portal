import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/utils/hook-creators";
import { k8sTaskRunConfig, TaskRun } from "@my-project/shared";

export const useTaskRunPermissions = createUsePermissionsHook(k8sTaskRunConfig);
export const useTaskRunWatchList = (params?: UseWatchListParamsWithoutResourceConfig<TaskRun>) =>
  createUseWatchListHook<TaskRun>(k8sTaskRunConfig)(params);
export const useTaskRunWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<TaskRun>) =>
  createUseWatchItemHook<TaskRun>(k8sTaskRunConfig)(params);
