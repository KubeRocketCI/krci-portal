import { MultiFormItem } from "@/core/providers/MultiForm/types";
import { FORM_MODES } from "@/core/types/forms";
import {
  ConfigMap,
  editKRCIConfigMapRegistryData,
  containerRegistryType,
  ContainerRegistryType,
} from "@my-project/shared";
import React from "react";
import { useForm } from "react-hook-form";
import { CONFIG_MAP_FORM_NAMES } from "../names";
import { ConfigMapFormValues } from "../types";
import { useConfigMapCRUD, useConfigMapPermissions } from "@/k8s/api/groups/Core/ConfigMap";

export const useConfigMapEditForm = ({
  EDPConfigMap,
}: {
  EDPConfigMap: ConfigMap | undefined;
}): MultiFormItem<ConfigMapFormValues> => {
  const {
    triggerEditConfigMap,
    mutations: { configMapEditMutation },
  } = useConfigMapCRUD();

  const configMapPermissions = useConfigMapPermissions();

  const defaultValues = React.useMemo(() => {
    const registryType = EDPConfigMap?.data?.container_registry_type;

    let defaultValuesBase: Partial<ConfigMapFormValues> = {
      [CONFIG_MAP_FORM_NAMES.REGISTRY_ENDPOINT]: EDPConfigMap?.data?.container_registry_host || "",
      [CONFIG_MAP_FORM_NAMES.REGISTRY_TYPE]:
        (EDPConfigMap?.data?.container_registry_type as ContainerRegistryType) || "",
      [CONFIG_MAP_FORM_NAMES.REGISTRY_SPACE]: EDPConfigMap?.data?.container_registry_space || "",
    };

    if (registryType === containerRegistryType.ecr) {
      defaultValuesBase = {
        ...defaultValuesBase,
        [CONFIG_MAP_FORM_NAMES.AWS_REGION]: EDPConfigMap?.data?.aws_region || "",
      };
    }

    return defaultValuesBase;
  }, [EDPConfigMap]);

  const form = useForm<ConfigMapFormValues>({
    defaultValues: defaultValues,
  });

  React.useEffect(() => {
    form.reset(defaultValues, { keepDirty: false });
  }, [defaultValues, form]);

  const handleSubmit = React.useCallback(
    async (values: ConfigMapFormValues) => {
      if (!configMapPermissions.data.patch.allowed || !EDPConfigMap) {
        return;
      }

      let updatedConfigMap: ConfigMap;

      if (values.registryType === containerRegistryType.ecr) {
        updatedConfigMap = editKRCIConfigMapRegistryData(EDPConfigMap, {
          registryType: values.registryType,
          registryEndpoint: values.registryEndpoint,
          registrySpace: values.registrySpace,
          awsRegion: values.awsRegion!,
        });
      } else {
        updatedConfigMap = editKRCIConfigMapRegistryData(EDPConfigMap, {
          registryType: values.registryType,
          registryEndpoint: values.registryEndpoint,
          registrySpace: values.registrySpace,
        });
      }

      if (!updatedConfigMap) {
        return;
      }

      triggerEditConfigMap({ data: { resource: updatedConfigMap } });
    },
    [EDPConfigMap, configMapPermissions.data.patch.allowed, triggerEditConfigMap]
  );

  return React.useMemo(
    () => ({
      mode: EDPConfigMap?.data?.container_registry_type === "" ? FORM_MODES.CREATE : FORM_MODES.EDIT,
      form,
      onSubmit: form.handleSubmit(handleSubmit),
      isSubmitting: configMapEditMutation.isPending,
      allowedToSubmit: {
        isAllowed: configMapPermissions.data.patch.allowed,
        reason: configMapPermissions.data.patch.reason,
      },
    }),
    [
      EDPConfigMap?.data?.container_registry_type,
      form,
      handleSubmit,
      configMapEditMutation.isPending,
      configMapPermissions.data.patch.allowed,
      configMapPermissions.data.patch.reason,
    ]
  );
};
