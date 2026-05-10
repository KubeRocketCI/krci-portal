import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sServiceConfig, Service } from "@my-project/shared";

export const useServicePermissions = createUsePermissionsHook(k8sServiceConfig);
export const useServiceWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Service>) =>
  createUseWatchListHook<Service>(k8sServiceConfig)(params);
export const useServiceWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Service>) =>
  createUseWatchItemHook<Service>(k8sServiceConfig)(params);
