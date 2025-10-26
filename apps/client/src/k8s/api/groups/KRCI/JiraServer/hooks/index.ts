import { useBasicCRUD } from "@/k8s/api/hooks/useBasicCRUD";
import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sJiraServerConfig, JiraServer } from "@my-project/shared";

export const useJiraServerCRUD = () => {
  const { triggerCreate, triggerEdit, triggerDelete, mutations } = useBasicCRUD(k8sJiraServerConfig);

  return {
    triggerCreateJiraServer: triggerCreate,
    triggerEditJiraServer: triggerEdit,
    triggerDeleteJiraServer: triggerDelete,
    mutations: {
      jiraServerCreateMutation: mutations.createMutation,
      jiraServerEditMutation: mutations.editMutation,
      jiraServerDeleteMutation: mutations.deleteMutation,
    },
  };
};

export const useJiraServerPermissions = createUsePermissionsHook(k8sJiraServerConfig);
export const useJiraServerWatchList = (params?: UseWatchListParamsWithoutResourceConfig<JiraServer>) =>
  createUseWatchListHook<JiraServer>(k8sJiraServerConfig)(params);
export const useJiraServerWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<JiraServer>) =>
  createUseWatchItemHook<JiraServer>(k8sJiraServerConfig)(params);
