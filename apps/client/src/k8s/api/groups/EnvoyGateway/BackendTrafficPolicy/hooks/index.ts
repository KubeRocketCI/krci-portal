import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sBackendTrafficPolicyConfig, BackendTrafficPolicy } from "@my-project/shared";

export const useBackendTrafficPolicyPermissions = createUsePermissionsHook(k8sBackendTrafficPolicyConfig);
export const useBackendTrafficPolicyWatchList = (
  params?: UseWatchListParamsWithoutResourceConfig<BackendTrafficPolicy>
) => createUseWatchListHook<BackendTrafficPolicy>(k8sBackendTrafficPolicyConfig)(params);
export const useBackendTrafficPolicyWatchItem = (
  params: UseWatchItemParamsWithoutResourceConfig<BackendTrafficPolicy>
) => createUseWatchItemHook<BackendTrafficPolicy>(k8sBackendTrafficPolicyConfig)(params);
