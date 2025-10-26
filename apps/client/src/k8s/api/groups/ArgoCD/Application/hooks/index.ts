import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sApplicationConfig, Application } from "@my-project/shared";

export { useCRUD as useApplicationCRUD } from "./useCRUD";

export const useApplicationPermissions = createUsePermissionsHook(k8sApplicationConfig);
export const useApplicationWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Application>) =>
  createUseWatchListHook<Application>(k8sApplicationConfig)(params);
export const useApplicationWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Application>) =>
  createUseWatchItemHook<Application>(k8sApplicationConfig)(params);
