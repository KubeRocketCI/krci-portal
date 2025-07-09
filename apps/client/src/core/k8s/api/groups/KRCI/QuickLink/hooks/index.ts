import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/core/k8s/api/utils/hook-creators";
import { k8sQuickLinkConfig, QuickLink } from "@my-project/shared";

export const useQuickLinkPermissions = createUsePermissionsHook(k8sQuickLinkConfig);
export const useQuickLinkWatchList = (params?: UseWatchListParamsWithoutResourceConfig<QuickLink>) =>
  createUseWatchListHook<QuickLink>(k8sQuickLinkConfig)(params);
export const useQuickLinkWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<QuickLink>) =>
  createUseWatchItemHook<QuickLink>(k8sQuickLinkConfig)(params);

export { useCRUD as useQuickLinkCRUD } from "./useCRUD";
