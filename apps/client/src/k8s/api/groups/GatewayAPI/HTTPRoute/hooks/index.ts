import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sHTTPRouteConfig, HTTPRoute } from "@my-project/shared";

export const useHTTPRoutePermissions = createUsePermissionsHook(k8sHTTPRouteConfig);
export const useHTTPRouteWatchList = (params?: UseWatchListParamsWithoutResourceConfig<HTTPRoute>) =>
  createUseWatchListHook<HTTPRoute>(k8sHTTPRouteConfig)(params);
export const useHTTPRouteWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<HTTPRoute>) =>
  createUseWatchItemHook<HTTPRoute>(k8sHTTPRouteConfig)(params);
