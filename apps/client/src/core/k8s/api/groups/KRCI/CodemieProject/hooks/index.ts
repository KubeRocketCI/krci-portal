import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/core/k8s/api/utils/hook-creators";
import { k8sCodemieProjectConfig, CodemieProject } from "@my-project/shared";

export const useCodemieProjectPermissions = createUsePermissionsHook(k8sCodemieProjectConfig);
export const useCodemieProjectWatchList = (params?: UseWatchListParamsWithoutResourceConfig<CodemieProject>) =>
  createUseWatchListHook<CodemieProject>(k8sCodemieProjectConfig)(params);
export const useCodemieProjectWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<CodemieProject>) =>
  createUseWatchItemHook<CodemieProject>(k8sCodemieProjectConfig)(params);
