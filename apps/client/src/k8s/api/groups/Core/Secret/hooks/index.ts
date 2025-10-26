import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sSecretConfig, Secret } from "@my-project/shared";
import { useBasicCRUD } from "@/k8s/api/hooks/useBasicCRUD";

export const useSecretCRUD = () => {
  const { triggerCreate, triggerEdit, triggerDelete, mutations } = useBasicCRUD(k8sSecretConfig);

  return {
    triggerCreateSecret: triggerCreate,
    triggerEditSecret: triggerEdit,
    triggerDeleteSecret: triggerDelete,
    mutations: {
      secretCreateMutation: mutations.createMutation,
      secretEditMutation: mutations.editMutation,
      secretDeleteMutation: mutations.deleteMutation,
    },
  };
};

export const useSecretPermissions = createUsePermissionsHook(k8sSecretConfig);
export const useSecretWatchList = (params?: UseWatchListParamsWithoutResourceConfig<Secret>) =>
  createUseWatchListHook<Secret>(k8sSecretConfig)(params);
export const useSecretWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<Secret>) =>
  createUseWatchItemHook<Secret>(k8sSecretConfig)(params);
