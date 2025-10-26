import { useBasicCRUD } from "@/k8s/api/hooks/useBasicCRUD";
import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sCodemieApplicationConfig, CodemieApplication } from "@my-project/shared";

export const useCodemieApplicationCRUD = () => {
  const { triggerCreate, triggerEdit, triggerDelete, mutations } = useBasicCRUD(k8sCodemieApplicationConfig);

  return {
    triggerCreateCodemieApplication: triggerCreate,
    triggerEditCodemieApplication: triggerEdit,
    triggerDeleteCodemieApplication: triggerDelete,
    mutations: {
      codemieApplicationCreateMutation: mutations.createMutation,
      codemieApplicationEditMutation: mutations.editMutation,
      codemieApplicationDeleteMutation: mutations.deleteMutation,
    },
  };
};

export const useCodemieApplicationPermissions = createUsePermissionsHook(k8sCodemieApplicationConfig);
export const useCodemieApplicationWatchList = (params?: UseWatchListParamsWithoutResourceConfig<CodemieApplication>) =>
  createUseWatchListHook<CodemieApplication>(k8sCodemieApplicationConfig)(params);
export const useCodemieApplicationWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<CodemieApplication>) =>
  createUseWatchItemHook<CodemieApplication>(k8sCodemieApplicationConfig)(params);
