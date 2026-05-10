import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sDeploymentConfig, Deployment } from "@my-project/shared";

export const useDeploymentPermissions = createUsePermissionsHook(k8sDeploymentConfig);
export const useDeploymentWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Deployment>) =>
  createUseWatchListHook<Deployment>(k8sDeploymentConfig)(params);
export const useDeploymentWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Deployment>) =>
  createUseWatchItemHook<Deployment>(k8sDeploymentConfig)(params);
