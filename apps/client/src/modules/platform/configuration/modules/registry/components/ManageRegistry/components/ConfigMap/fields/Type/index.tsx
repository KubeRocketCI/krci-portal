import React from "react";
import { useStore } from "@tanstack/react-form";
import { useDataContext } from "../../../../providers/Data/hooks";
import { FORM_MODES } from "@/core/types/forms";
import { REGISTRY_TYPE_ICON_MAPPING } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { RESOURCE_ICON_NAMES } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import {
  ContainerRegistryPlatform,
  containerRegistryType,
  containerRegistryTypeByPlatform,
  containerRegistryTypeLabelMap,
  DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT,
  GHCR_DEFAULT_REGISTRY_ENDPOINT,
} from "@my-project/shared";
import { useManageRegistryForm } from "../../../../providers/form/hooks";
import { NAMES } from "../../../../schema";

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
  const form = useManageRegistryForm();
  const { EDPConfigMap } = useDataContext();

  const platform = EDPConfigMap?.data?.platform;

  const registryType = useStore(form.store, (state) => state.values[NAMES.REGISTRY_TYPE]);
  const mode = registryType ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  const options = React.useMemo(
    () =>
      createRegistryTypeOptions(platform as ContainerRegistryPlatform).map(({ label, value }) => ({
        value,
        label,
        icon: (
          <UseSpriteSymbol
            name={REGISTRY_TYPE_ICON_MAPPING?.[value] || RESOURCE_ICON_NAMES.OTHER}
            width={20}
            height={20}
          />
        ),
      })),
    [platform]
  );

  return (
    <form.AppField
      name={NAMES.REGISTRY_TYPE}
      listeners={{
        onChange: ({ value }) => {
          switch (value) {
            case containerRegistryType.dockerhub:
              form.setFieldValue(NAMES.REGISTRY_ENDPOINT, DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT, {
                dontUpdateMeta: true,
              });
              break;
            case containerRegistryType.ghcr:
              form.setFieldValue(NAMES.REGISTRY_ENDPOINT, GHCR_DEFAULT_REGISTRY_ENDPOINT, {
                dontUpdateMeta: true,
              });
              break;
            case containerRegistryType.ecr:
              form.setFieldValue(NAMES.PUSH_ACCOUNT_PASSWORD, "", {
                dontUpdateMeta: true,
              });
              break;
            default:
              form.setFieldValue(NAMES.REGISTRY_ENDPOINT, "", {
                dontUpdateMeta: true,
              });
          }
        },
      }}
    >
      {(field) => (
        <field.FormSelect
          label="Registry Provider"
          tooltipText="Select a registry type you would like to create"
          placeholder="Select registry provider"
          options={options}
          disabled={mode === FORM_MODES.EDIT}
        />
      )}
    </form.AppField>
  );
};
