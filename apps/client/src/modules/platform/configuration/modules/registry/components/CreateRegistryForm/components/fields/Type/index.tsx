import React from "react";
import { useStore } from "@tantml:function_calls";
import { REGISTRY_TYPE_ICON_MAPPING } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { RESOURCE_ICON_NAMES } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import {
  ContainerRegistryPlatform,
  containerRegistryType,
  containerRegistryPlatform,
  containerRegistryTypeByPlatform,
  containerRegistryTypeLabelMap,
  DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT,
  GHCR_DEFAULT_REGISTRY_ENDPOINT,
} from "@my-project/shared";
import { useCreateRegistryForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../constants";

const createRegistryTypeOptions = (platformName?: ContainerRegistryPlatform) => {
  // Default to kubernetes platform if not specified
  const platform = platformName || containerRegistryPlatform.kubernetes;

  if (!containerRegistryTypeByPlatform?.[platform]) {
    return [];
  }

  return containerRegistryTypeByPlatform[platform].map((value) => ({
    label: containerRegistryTypeLabelMap[value],
    value: value,
  }));
};

interface TypeProps {
  platform?: ContainerRegistryPlatform;
}

export const Type = ({ platform }: TypeProps) => {
  const form = useCreateRegistryForm();

  const options = React.useMemo(() => {
    const baseOptions = createRegistryTypeOptions(platform);
    return baseOptions.map(({ label, value }) => ({
      value,
      label,
      icon: (
        <UseSpriteSymbol
          name={REGISTRY_TYPE_ICON_MAPPING?.[value] || RESOURCE_ICON_NAMES.OTHER}
          width={20}
          height={20}
        />
      ),
    }));
  }, [platform]);

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
        />
      )}
    </form.AppField>
  );
};
