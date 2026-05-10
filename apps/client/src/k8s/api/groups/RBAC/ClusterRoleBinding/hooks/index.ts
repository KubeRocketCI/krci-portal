import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sClusterRoleBindingConfig, ClusterRoleBinding } from "@my-project/shared";

export const useClusterRoleBindingPermissions = createUsePermissionsHook(k8sClusterRoleBindingConfig);
export const useClusterRoleBindingWatchList = (params?: UseWatchListParamsWithoutResourceConfig<ClusterRoleBinding>) =>
  createUseWatchListHook<ClusterRoleBinding>(k8sClusterRoleBindingConfig)(params);
export const useClusterRoleBindingWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<ClusterRoleBinding>) =>
  createUseWatchItemHook<ClusterRoleBinding>(k8sClusterRoleBindingConfig)(params);
