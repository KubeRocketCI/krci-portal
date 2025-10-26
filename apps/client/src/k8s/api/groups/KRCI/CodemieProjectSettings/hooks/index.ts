import { useBasicCRUD } from "@/k8s/api/hooks/useBasicCRUD";
import {
  createUsePermissionsHook,
  createUseWatchListHook,
  createUseWatchItemHook,
  UseWatchItemParamsWithoutResourceConfig,
  UseWatchListParamsWithoutResourceConfig,
} from "@/k8s/api/hooks/hook-creators";
import { k8sCodemieProjectSettingsConfig, CodemieProjectSettings } from "@my-project/shared";

export const useCodemieProjectSettingsCRUD = () => {
  const { triggerCreate, triggerEdit, triggerDelete, mutations } = useBasicCRUD(k8sCodemieProjectSettingsConfig);

  return {
    triggerCreateCodemieProjectSettings: triggerCreate,
    triggerEditCodemieProjectSettings: triggerEdit,
    triggerDeleteCodemieProjectSettings: triggerDelete,
    mutations: {
      codemieProjectSettingsCreateMutation: mutations.createMutation,
      codemieProjectSettingsEditMutation: mutations.editMutation,
      codemieProjectSettingsDeleteMutation: mutations.deleteMutation,
    },
  };
};

export const useCodemieProjectSettingsPermissions = createUsePermissionsHook(k8sCodemieProjectSettingsConfig);
export const useCodemieProjectSettingsWatchList = (
  params?: UseWatchListParamsWithoutResourceConfig<CodemieProjectSettings>
) => createUseWatchListHook<CodemieProjectSettings>(k8sCodemieProjectSettingsConfig)(params);
export const useCodemieProjectSettingsWatchItem = (
  params: UseWatchItemParamsWithoutResourceConfig<CodemieProjectSettings>
) => createUseWatchItemHook<CodemieProjectSettings>(k8sCodemieProjectSettingsConfig)(params);
