import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sSecurityPolicyConfig, SecurityPolicy } from "@my-project/shared";

export const useSecurityPolicyPermissions = createUsePermissionsHook(k8sSecurityPolicyConfig);
export const useSecurityPolicyWatchList = (params?: UseWatchListParamsWithoutResourceConfig<SecurityPolicy>) =>
  createUseWatchListHook<SecurityPolicy>(k8sSecurityPolicyConfig)(params);
export const useSecurityPolicyWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<SecurityPolicy>) =>
  createUseWatchItemHook<SecurityPolicy>(k8sSecurityPolicyConfig)(params);
