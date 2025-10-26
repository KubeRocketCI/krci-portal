import { useBasicCRUD } from "@/k8s/api/hooks/useBasicCRUD";
import {
  createUsePermissionsHook,
  createUseWatchItemHook,
  createUseWatchListHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { ConfigMap, k8sConfigMapConfig } from "@my-project/shared";

export const useConfigMapCRUD = () => {
  const { triggerCreate, triggerEdit, triggerDelete, mutations } = useBasicCRUD(k8sConfigMapConfig);

  return {
    triggerCreateConfigMap: triggerCreate,
    triggerEditConfigMap: triggerEdit,
    triggerDeleteConfigMap: triggerDelete,
    mutations: {
      configMapCreateMutation: mutations.createMutation,
      configMapEditMutation: mutations.editMutation,
      configMapDeleteMutation: mutations.deleteMutation,
    },
  };
};

export const useConfigMapPermissions = createUsePermissionsHook(k8sConfigMapConfig);
export const useConfigMapWatchList = (params?: UseWatchListParamsWithoutResourceConfig<ConfigMap>) =>
  createUseWatchListHook<ConfigMap>(k8sConfigMapConfig)(params);
export const useConfigMapWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<ConfigMap>) =>
  createUseWatchItemHook<ConfigMap>(k8sConfigMapConfig)(params);
