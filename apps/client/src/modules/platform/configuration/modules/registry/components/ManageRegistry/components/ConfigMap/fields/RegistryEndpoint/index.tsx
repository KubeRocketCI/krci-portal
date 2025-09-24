import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { FieldEvent } from "@/core/types/forms";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";
import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";
import { ContainerRegistryType, containerRegistryType } from "@my-project/shared";
import { useRegistryFormsContext } from "../../../../hooks/useRegistryFormsContext";
import { CONFIG_MAP_FORM_NAMES, SHARED_FORM_NAMES } from "../../../../names";

const TYPE_EMPTY_MESSAGE_MAP = {
  [containerRegistryType.harbor]: "Enter the Harbor registry endpoint URL.",
  [containerRegistryType.ecr]: "Enter the AWS ECR registry endpoint URL.",
  [containerRegistryType.dockerhub]: "Enter the DockerHub registry endpoint URL.",
  [containerRegistryType.openshift]: "Enter the OpenShift registry endpoint URL.",
  [containerRegistryType.nexus]: "Enter the Nexus registry endpoint URL.",
  [containerRegistryType.ghcr]: "Enter the Github Container registry endpoint URL.",
};

const TYPE_TITLE_MAP = {
  [containerRegistryType.harbor]: "Input the Harbor registry endpoint URL (e.g., registry.example.com).",
  [containerRegistryType.ecr]:
    "Enter the AWS ECR registry endpoint URL. (E.g., 122333444455.dkr.ecr.us-east-1.amazonaws.com).",
  [containerRegistryType.dockerhub]: "Enter the DockerHub registry endpoint URL (e.g., docker.io).",
  [containerRegistryType.openshift]:
    "Enter the OpenShift registry endpoint URL (e.g., image-registry.openshift-image-registry.svc:5000).",
  [containerRegistryType.nexus]: "Enter the Nexus registry endpoint URL (e.g., nexus.example.com).",
  [containerRegistryType.ghcr]: "Enter the Github Container registry endpoint URL (e.g., ghcr.io).",
};

export const RegistryEndpoint = () => {
  const {
    forms: { configMap, pushAccount, pullAccount },
    sharedForm,
  } = useRegistryFormsContext();

  const registryTypeFieldValue = configMap.form.watch(CONFIG_MAP_FORM_NAMES.REGISTRY_TYPE);

  return (
    <FormTextField
      {...configMap.form.register(CONFIG_MAP_FORM_NAMES.REGISTRY_ENDPOINT, {
        onChange: ({ target: { value } }: FieldEvent) => {
          sharedForm.setValue(SHARED_FORM_NAMES.REGISTRY_ENDPOINT, value);

          switch (registryTypeFieldValue) {
            case containerRegistryType.harbor:
            case containerRegistryType.ghcr:
            case containerRegistryType.dockerhub:
            case containerRegistryType.nexus:
            case containerRegistryType.openshift:
              pushAccount.form.setValue(SHARED_FORM_NAMES.REGISTRY_ENDPOINT, value, {
                shouldDirty: true,
              });
              pullAccount.form.setValue(SHARED_FORM_NAMES.REGISTRY_ENDPOINT, value, {
                shouldDirty: true,
              });
          }
        },
        required:
          TYPE_EMPTY_MESSAGE_MAP[registryTypeFieldValue as ContainerRegistryType] || "Enter registry endpoint URL.",
        pattern: {
          value: getValidURLPattern(VALIDATED_PROTOCOL.NO_PROTOCOL),
          message: "Enter a valid URL without protocol.",
        },
      })}
      label={"Registry Endpoint"}
      placeholder={"Enter registry endpoint"}
      tooltipText={TYPE_TITLE_MAP[registryTypeFieldValue as ContainerRegistryType] || "Enter registry endpoint URL."}
      control={configMap.form.control}
      errors={configMap.form.formState.errors}
      disabled={
        registryTypeFieldValue === containerRegistryType.dockerhub ||
        registryTypeFieldValue === containerRegistryType.ghcr
      }
    />
  );
};
