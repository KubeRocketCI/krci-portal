import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sNodeConfig, Node } from "@my-project/shared";

export const useNodePermissions = createUsePermissionsHook(k8sNodeConfig);
export const useNodeWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Node>) =>
  createUseWatchListHook<Node>(k8sNodeConfig)(params);
export const useNodeWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Node>) =>
  createUseWatchItemHook<Node>(k8sNodeConfig)(params);
