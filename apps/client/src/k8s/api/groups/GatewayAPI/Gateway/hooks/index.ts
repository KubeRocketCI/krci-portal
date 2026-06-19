import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sGatewayConfig, Gateway } from "@my-project/shared";

export const useGatewayPermissions = createUsePermissionsHook(k8sGatewayConfig);
export const useGatewayWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Gateway>) =>
  createUseWatchListHook<Gateway>(k8sGatewayConfig)(params);
export const useGatewayWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Gateway>) =>
  createUseWatchItemHook<Gateway>(k8sGatewayConfig)(params);
