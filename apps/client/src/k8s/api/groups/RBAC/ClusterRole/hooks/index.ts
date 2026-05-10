import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sClusterRoleConfig, ClusterRole } from "@my-project/shared";

export const useClusterRolePermissions = createUsePermissionsHook(k8sClusterRoleConfig);
export const useClusterRoleWatchList = (params?: UseWatchListParamsWithoutResourceConfig<ClusterRole>) =>
  createUseWatchListHook<ClusterRole>(k8sClusterRoleConfig)(params);
export const useClusterRoleWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<ClusterRole>) =>
  createUseWatchItemHook<ClusterRole>(k8sClusterRoleConfig)(params);
