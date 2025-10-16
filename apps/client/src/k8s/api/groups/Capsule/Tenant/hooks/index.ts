import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/utils/hook-creators";
import { k8sTenantConfig, Tenant } from "@my-project/shared";

export const useTenantPermissions = createUsePermissionsHook(k8sTenantConfig);
export const useTenantWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Tenant>) =>
  createUseWatchListHook<Tenant>(k8sTenantConfig)(params);
export const useTenantWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Tenant>) =>
  createUseWatchItemHook<Tenant>(k8sTenantConfig)(params);
