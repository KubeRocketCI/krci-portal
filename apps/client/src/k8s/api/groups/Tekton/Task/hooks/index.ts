import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sTaskConfig, Task } from "@my-project/shared";

export { useCRUD as useTaskCRUD } from "./useCRUD";

export const useTaskPermissions = createUsePermissionsHook(k8sTaskConfig);
export const useTaskWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Task>) =>
  createUseWatchListHook<Task>(k8sTaskConfig)(params);
export const useTaskWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Task>) =>
  createUseWatchItemHook<Task>(k8sTaskConfig)(params);
