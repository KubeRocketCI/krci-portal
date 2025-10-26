import { useBasicCRUD } from "@/k8s/api/hooks/useBasicCRUD";
import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sCodemieConfig, Codemie } from "@my-project/shared";

export const useCodemieCRUD = () => {
  const { triggerCreate, triggerEdit, triggerDelete, mutations } = useBasicCRUD(k8sCodemieConfig);

  return {
    triggerCreateCodemie: triggerCreate,
    triggerEditCodemie: triggerEdit,
    triggerDeleteCodemie: triggerDelete,
    mutations: {
      codemieCreateMutation: mutations.createMutation,
      codemieEditMutation: mutations.editMutation,
      codemieDeleteMutation: mutations.deleteMutation,
    },
  };
};

export const useCodemiePermissions = createUsePermissionsHook(k8sCodemieConfig);
export const useCodemieWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Codemie>) =>
  createUseWatchListHook<Codemie>(k8sCodemieConfig)(params);
export const useCodemieWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Codemie>) =>
  createUseWatchItemHook<Codemie>(k8sCodemieConfig)(params);
