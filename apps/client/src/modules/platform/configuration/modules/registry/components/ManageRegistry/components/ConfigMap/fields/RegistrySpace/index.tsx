import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { useRegistryFormsContext } from "../../../../hooks/useRegistryFormsContext";
import { CONFIG_MAP_FORM_NAMES } from "../../../../names";
import { ContainerRegistryType, containerRegistryType } from "@my-project/shared";

const TYPE_LABEL_MAP = {
  [containerRegistryType.harbor]: "Registry Space",
  [containerRegistryType.ecr]: "Registry Space",
  [containerRegistryType.dockerhub]: "Registry Space",
  [containerRegistryType.openshift]: "Project",
  [containerRegistryType.nexus]: "Repository",
  [containerRegistryType.ghcr]: "Registry Space",
};

const TYPE_TITLE_MAP = {
  [containerRegistryType.harbor]: "Specify the Kubernetes namespace that corresponds to the project name in Harbor.",
  [containerRegistryType.ecr]: "Specify the Kubernetes namespace name to associate with AWS ECR.",
  [containerRegistryType.dockerhub]: "Specify the name of the DockerHub account or organization.",
  [containerRegistryType.openshift]: "Specify the OpenShift registry space.",
  [containerRegistryType.nexus]: "Specify the Nexus repository that corresponds to your project.",
  [containerRegistryType.ghcr]: "Specify the name of the Github account or organization.",
};

const TYPE_EMPTY_MESSAGE_MAP = {
  [containerRegistryType.harbor]: "Enter the username for Harbor registry authentication.",
  [containerRegistryType.ecr]: "Enter the Kubernetes namespace name for AWS ECR.",
  [containerRegistryType.dockerhub]: "Enter the DockerHub account or organization name.",
  [containerRegistryType.openshift]: "Enter the OpenShift registry space.",
  [containerRegistryType.nexus]: "Enter the Nexus repository name.",
  [containerRegistryType.ghcr]: "Enter the Github account or organization name.",
};

export const RegistrySpace = () => {
  const {
    forms: { configMap },
  } = useRegistryFormsContext();

  const registryTypeFieldValue = configMap.form.watch(CONFIG_MAP_FORM_NAMES.REGISTRY_TYPE);

  return (
    <FormTextField
      {...configMap.form.register(CONFIG_MAP_FORM_NAMES.REGISTRY_SPACE, {
        required: TYPE_EMPTY_MESSAGE_MAP[registryTypeFieldValue as ContainerRegistryType] || "Enter registry space.",
        pattern: {
          value: /^[a-z0-9_-]+$/,
          message: "Only alphanumeric characters, underscores, and hyphens are allowed.",
        },
      })}
      label={TYPE_LABEL_MAP[registryTypeFieldValue as ContainerRegistryType] || "Registry Space"}
      tooltipText={TYPE_TITLE_MAP[registryTypeFieldValue as ContainerRegistryType] || "Specify registry space."}
      placeholder={"Enter registry space"}
      control={configMap.form.control}
      errors={configMap.form.formState.errors}
    />
  );
};
