import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/utils/hook-creators";
import { k8sCodemieConfig, Codemie } from "@my-project/shared";

export const useCodemiePermissions = createUsePermissionsHook(k8sCodemieConfig);
export const useCodemieWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Codemie>) =>
  createUseWatchListHook<Codemie>(k8sCodemieConfig)(params);
export const useCodemieWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Codemie>) =>
  createUseWatchItemHook<Codemie>(k8sCodemieConfig)(params);
