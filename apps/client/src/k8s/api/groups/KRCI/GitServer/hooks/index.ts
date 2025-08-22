import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/utils/hook-creators";
import { k8sGitServerConfig, GitServer } from "@my-project/shared";

export const useGitServerPermissions = createUsePermissionsHook(k8sGitServerConfig);
export const useGitServerWatchList = (params?: UseWatchListParamsWithoutResourceConfig<GitServer>) =>
  createUseWatchListHook<GitServer>(k8sGitServerConfig)(params);
export const useGitServerWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<GitServer>) =>
  createUseWatchItemHook<GitServer>(k8sGitServerConfig)(params);
