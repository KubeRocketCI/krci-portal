import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sApprovalTaskConfig, ApprovalTask } from "@my-project/shared";

export const useApprovalTaskPermissions = createUsePermissionsHook(k8sApprovalTaskConfig);
export const useApprovalTaskWatchList = (params?: UseWatchListParamsWithoutResourceConfig<ApprovalTask>) =>
  createUseWatchListHook<ApprovalTask>(k8sApprovalTaskConfig)(params);
export const useApprovalTaskWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<ApprovalTask>) =>
  createUseWatchItemHook<ApprovalTask>(k8sApprovalTaskConfig)(params);
