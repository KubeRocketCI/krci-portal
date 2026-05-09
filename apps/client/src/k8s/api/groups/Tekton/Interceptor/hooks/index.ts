import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sInterceptorConfig, Interceptor } from "@my-project/shared";

export const useInterceptorPermissions = createUsePermissionsHook(k8sInterceptorConfig);
export const useInterceptorWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Interceptor>) =>
  createUseWatchListHook<Interceptor>(k8sInterceptorConfig)(params);
export const useInterceptorWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Interceptor>) =>
  createUseWatchItemHook<Interceptor>(k8sInterceptorConfig)(params);
