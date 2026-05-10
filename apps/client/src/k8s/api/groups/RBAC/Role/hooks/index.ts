import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sRoleConfig, Role } from "@my-project/shared";

export const useRolePermissions = createUsePermissionsHook(k8sRoleConfig);
export const useRoleWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Role>) =>
  createUseWatchListHook<Role>(k8sRoleConfig)(params);
export const useRoleWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Role>) =>
  createUseWatchItemHook<Role>(k8sRoleConfig)(params);
