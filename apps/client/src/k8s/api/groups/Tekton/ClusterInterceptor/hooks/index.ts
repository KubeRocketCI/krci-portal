import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sClusterInterceptorConfig, ClusterInterceptor } from "@my-project/shared";

export const useClusterInterceptorPermissions = createUsePermissionsHook(k8sClusterInterceptorConfig);
export const useClusterInterceptorWatchList = (params?: UseWatchListParamsWithoutResourceConfig<ClusterInterceptor>) =>
  createUseWatchListHook<ClusterInterceptor>(k8sClusterInterceptorConfig)(params);
export const useClusterInterceptorWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<ClusterInterceptor>) =>
  createUseWatchItemHook<ClusterInterceptor>(k8sClusterInterceptorConfig)(params);
