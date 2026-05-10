import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sRoleBindingConfig, RoleBinding } from "@my-project/shared";

export const useRoleBindingPermissions = createUsePermissionsHook(k8sRoleBindingConfig);
export const useRoleBindingWatchList = (params?: UseWatchListParamsWithoutResourceConfig<RoleBinding>) =>
  createUseWatchListHook<RoleBinding>(k8sRoleBindingConfig)(params);
export const useRoleBindingWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<RoleBinding>) =>
  createUseWatchItemHook<RoleBinding>(k8sRoleBindingConfig)(params);
