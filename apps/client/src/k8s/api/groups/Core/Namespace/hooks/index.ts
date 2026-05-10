import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sNamespaceConfig, Namespace } from "@my-project/shared";

export const useNamespacePermissions = createUsePermissionsHook(k8sNamespaceConfig);
export const useNamespaceWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Namespace>) =>
  createUseWatchListHook<Namespace>(k8sNamespaceConfig)(params);
export const useNamespaceWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Namespace>) =>
  createUseWatchItemHook<Namespace>(k8sNamespaceConfig)(params);
