import React from "react";
import { useRegistryFormsContext } from "../../../../hooks/useRegistryFormsContext";
import { CONFIG_MAP_FORM_NAMES, PUSH_ACCOUNT_FORM_NAMES, SHARED_FORM_NAMES } from "../../../../names";
import { useDataContext } from "../../../../providers/Data/hooks";
import { FormRadioGroup } from "@/core/providers/Form/components/FormRadioGroup";
import { FieldEvent, FORM_MODES } from "@/core/types/forms";
import { REGISTRY_TYPE_ICON_MAPPING } from "@/k8s/configs/icon-mappings";
import { RESOURCE_ICON_NAMES } from "@/k8s/icons/sprites/Resources/names";
import { UseSpriteSymbol } from "@/k8s/icons/UseSpriteSymbol";
import { K8sRelatedIconsSVGSprite } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import {
  ContainerRegistryPlatform,
  containerRegistryType,
  containerRegistryTypeByPlatform,
  containerRegistryTypeLabelMap,
  DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT,
  GHCR_DEFAULT_REGISTRY_ENDPOINT,
} from "@my-project/shared";

const createRegistryTypeOptions = (platformName: ContainerRegistryPlatform) => {
  if (!platformName || !containerRegistryTypeByPlatform?.[platformName]) {
    return [];
  }

  return containerRegistryTypeByPlatform[platformName].map((value) => ({
    label: containerRegistryTypeLabelMap[value],
    value: value,
  }));
};

export const Type = () => {
  const {
    forms: { configMap, pushAccount },
    sharedForm,
  } = useRegistryFormsContext();

  const { EDPConfigMap } = useDataContext();

  const platform = EDPConfigMap?.data?.platform;

  const registryTypeOptions = React.useMemo(
    () => createRegistryTypeOptions(platform as ContainerRegistryPlatform),
    [platform]
  );

  return (
    <>
      <K8sRelatedIconsSVGSprite />
      <FormRadioGroup
        {...configMap.form.register(CONFIG_MAP_FORM_NAMES.REGISTRY_TYPE, {
          required: "Select a registry type you would like to create.",
          onChange: ({ target: { value } }: FieldEvent) => {
            sharedForm.setValue(SHARED_FORM_NAMES.REGISTRY_TYPE, value, {
              shouldDirty: false,
            });

            switch (value) {
              case containerRegistryType.dockerhub:
                configMap.form.setValue(CONFIG_MAP_FORM_NAMES.REGISTRY_ENDPOINT, DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT, {
                  shouldDirty: false,
                });
                sharedForm.setValue(SHARED_FORM_NAMES.REGISTRY_ENDPOINT, DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT, {
                  shouldDirty: false,
                });
                break;
              case containerRegistryType.ghcr:
                configMap.form.setValue(CONFIG_MAP_FORM_NAMES.REGISTRY_ENDPOINT, GHCR_DEFAULT_REGISTRY_ENDPOINT, {
                  shouldDirty: false,
                });
                sharedForm.setValue(SHARED_FORM_NAMES.REGISTRY_ENDPOINT, GHCR_DEFAULT_REGISTRY_ENDPOINT, {
                  shouldDirty: false,
                });
                break;
              case containerRegistryType.ecr:
                pushAccount.form.setValue(PUSH_ACCOUNT_FORM_NAMES.PUSH_ACCOUNT_PASSWORD, "", {
                  shouldDirty: true,
                });
                break;
              default:
                configMap.form.resetField(CONFIG_MAP_FORM_NAMES.REGISTRY_ENDPOINT, {
                  keepDirty: false,
                });
                sharedForm.resetField(SHARED_FORM_NAMES.REGISTRY_ENDPOINT, {
                  keepDirty: false,
                });
            }
          },
        })}
        control={configMap.form.control}
        errors={configMap.form.formState.errors}
        label={"Registry Provider"}
        tooltipText={"Select a registry type you would like to create"}
        options={registryTypeOptions.map(({ label, value }) => {
          return {
            value,
            label,
            icon: (
              <UseSpriteSymbol
                name={REGISTRY_TYPE_ICON_MAPPING?.[value] || RESOURCE_ICON_NAMES.OTHER}
                width={20}
                height={20}
              />
            ),
            checkedIcon: (
              <UseSpriteSymbol
                name={REGISTRY_TYPE_ICON_MAPPING?.[value] || RESOURCE_ICON_NAMES.OTHER}
                width={20}
                height={20}
              />
            ),
          };
        })}
        disabled={configMap.mode === FORM_MODES.EDIT}
      />
    </>
  );
};
