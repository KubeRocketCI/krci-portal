import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sJobConfig, Job } from "@my-project/shared";

export const useJobPermissions = createUsePermissionsHook(k8sJobConfig);
export const useJobWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Job>) =>
  createUseWatchListHook<Job>(k8sJobConfig)(params);
export const useJobWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Job>) =>
  createUseWatchItemHook<Job>(k8sJobConfig)(params);
