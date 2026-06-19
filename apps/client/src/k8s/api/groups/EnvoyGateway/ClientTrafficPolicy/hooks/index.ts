import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sClientTrafficPolicyConfig, ClientTrafficPolicy } from "@my-project/shared";

export const useClientTrafficPolicyPermissions = createUsePermissionsHook(k8sClientTrafficPolicyConfig);
export const useClientTrafficPolicyWatchList = (
  params?: UseWatchListParamsWithoutResourceConfig<ClientTrafficPolicy>
) => createUseWatchListHook<ClientTrafficPolicy>(k8sClientTrafficPolicyConfig)(params);
export const useClientTrafficPolicyWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<ClientTrafficPolicy>) =>
  createUseWatchItemHook<ClientTrafficPolicy>(k8sClientTrafficPolicyConfig)(params);
