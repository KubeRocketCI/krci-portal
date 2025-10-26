import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sResourceQuotaConfig, ResourceQuota } from "@my-project/shared";

export const useResourceQuotaPermissions = createUsePermissionsHook(k8sResourceQuotaConfig);
export const useResourceQuotaWatchList = (params?: UseWatchListParamsWithoutResourceConfig<ResourceQuota>) =>
  createUseWatchListHook<ResourceQuota>(k8sResourceQuotaConfig)(params);
export const useResourceQuotaWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<ResourceQuota>) =>
  createUseWatchItemHook<ResourceQuota>(k8sResourceQuotaConfig)(params);
