import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sIngressConfig, Ingress } from "@my-project/shared";

export const useIngressPermissions = createUsePermissionsHook(k8sIngressConfig);
export const useIngressWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Ingress>) =>
  createUseWatchListHook<Ingress>(k8sIngressConfig)(params);
export const useIngressWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Ingress>) =>
  createUseWatchItemHook<Ingress>(k8sIngressConfig)(params);
