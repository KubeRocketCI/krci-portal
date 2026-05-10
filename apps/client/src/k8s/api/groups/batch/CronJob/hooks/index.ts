import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sCronJobConfig, CronJob } from "@my-project/shared";

export const useCronJobPermissions = createUsePermissionsHook(k8sCronJobConfig);
export const useCronJobWatchList = (params?: UseWatchListParamsWithoutResourceConfig<CronJob>) =>
  createUseWatchListHook<CronJob>(k8sCronJobConfig)(params);
export const useCronJobWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<CronJob>) =>
  createUseWatchItemHook<CronJob>(k8sCronJobConfig)(params);
