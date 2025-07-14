import {
  createUsePermissionsHook,
  createUseWatchItemHook,
  createUseWatchListHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/core/k8s/api/utils/hook-creators";
import { CodebaseImageStream, k8sCodebaseImageStreamConfig } from "@my-project/shared";

export const useCodebaseImageStreamPermissions = createUsePermissionsHook(k8sCodebaseImageStreamConfig);
export const useCodebaseImageStreamWatchList = (params?: UseWatchListParamsWithoutResourceConfig<CodebaseImageStream>) =>
  createUseWatchListHook<CodebaseImageStream>(k8sCodebaseImageStreamConfig)(params);
export const useCodebaseImageStreamWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<CodebaseImageStream>) =>
  createUseWatchItemHook<CodebaseImageStream>(k8sCodebaseImageStreamConfig)(params);
