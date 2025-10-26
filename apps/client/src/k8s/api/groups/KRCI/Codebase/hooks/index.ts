import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
  createUseWatchListMultipleHook,
  UseWatchListMultipleParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";

import { k8sCodebaseConfig, Codebase } from "@my-project/shared";

export { useCRUD as useCodebaseCRUD } from "./useCRUD";
export { useWatchGitOpsCodebase } from "./useWatchGitOpsCodebase";

export const useCodebasePermissions = createUsePermissionsHook(k8sCodebaseConfig);
export const useCodebaseWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Codebase>) =>
  createUseWatchListHook<Codebase>(k8sCodebaseConfig)(params);
export const useCodebaseWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Codebase>) =>
  createUseWatchItemHook<Codebase>(k8sCodebaseConfig)(params);
export const useCodebaseWatchListMultiple = (params?: UseWatchListMultipleParamsWithoutResourceConfig<Codebase>) =>
  createUseWatchListMultipleHook<Codebase>(k8sCodebaseConfig)(params);
