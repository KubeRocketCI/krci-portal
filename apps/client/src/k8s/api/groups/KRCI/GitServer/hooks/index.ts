import { useBasicCRUD } from "@/k8s/api/hooks/useBasicCRUD";
import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/utils/hook-creators";
import { k8sGitServerConfig, GitServer } from "@my-project/shared";

export const useGitServerCRUD = () => {
  const { triggerCreate, triggerEdit, triggerDelete, mutations } = useBasicCRUD(k8sGitServerConfig);

  return {
    triggerCreateGitServer: triggerCreate,
    triggerEditGitServer: triggerEdit,
    triggerDeleteGitServer: triggerDelete,
    mutations: {
      gitServerCreateMutation: mutations.createMutation,
      gitServerEditMutation: mutations.editMutation,
      gitServerDeleteMutation: mutations.deleteMutation,
    },
  };
};

export const useGitServerPermissions = createUsePermissionsHook(k8sGitServerConfig);
export const useGitServerWatchList = (params?: UseWatchListParamsWithoutResourceConfig<GitServer>) =>
  createUseWatchListHook<GitServer>(k8sGitServerConfig)(params);
export const useGitServerWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<GitServer>) =>
  createUseWatchItemHook<GitServer>(k8sGitServerConfig)(params);
