import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/utils/hook-creators";
import { k8sServiceAccountConfig, ServiceAccount } from "@my-project/shared";
import { useBasicCRUD } from "@/k8s/api/hooks/useBasicCRUD";

export const useServiceAccountCRUD = () => {
  const { triggerCreate, triggerEdit, triggerDelete, mutations } = useBasicCRUD(k8sServiceAccountConfig);

  return {
    triggerCreateServiceAccount: triggerCreate,
    triggerEditServiceAccount: triggerEdit,
    triggerDeleteServiceAccount: triggerDelete,
    mutations: {
      serviceAccountCreateMutation: mutations.createMutation,
      serviceAccountEditMutation: mutations.editMutation,
      serviceAccountDeleteMutation: mutations.deleteMutation,
    },
  };
};

export const useServiceAccountPermissions = createUsePermissionsHook(k8sServiceAccountConfig);
export const useServiceAccountWatchList = (params?: UseWatchListParamsWithoutResourceConfig<ServiceAccount>) =>
  createUseWatchListHook<ServiceAccount>(k8sServiceAccountConfig)(params);
export const useServiceAccountWatchItem = (params: UseWatchItemParamsWithoutResourceConfig<ServiceAccount>) =>
  createUseWatchItemHook<ServiceAccount>(k8sServiceAccountConfig)(params);
