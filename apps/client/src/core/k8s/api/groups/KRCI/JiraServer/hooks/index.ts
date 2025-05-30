import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/core/k8s/api/utils/hook-creators";
import { k8sJiraServerConfig, JiraServer } from "@my-project/shared";

export const useJiraServerPermissions = createUsePermissionsHook(k8sJiraServerConfig);
export const useJiraServerWatchList = (params?: UseWatchListParamsWithoutResourceConfig<JiraServer>) =>
  createUseWatchListHook<JiraServer>(k8sJiraServerConfig)(params);
export const useJiraServerWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<JiraServer>) =>
  createUseWatchItemHook<JiraServer>(k8sJiraServerConfig)(params);
