import { useStore } from "@tanstack/react-form";
import { ContainerRegistryType, containerRegistryType } from "@my-project/shared";
import { useManageRegistryForm } from "../../../../providers/form/hooks";
import { NAMES } from "../../../../schema";

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

export const RegistrySpace = () => {
  const form = useManageRegistryForm();

  const registryTypeFieldValue = useStore(form.store, (state) => state.values[NAMES.REGISTRY_TYPE]);

  return (
    <form.AppField name={NAMES.REGISTRY_SPACE}>
      {(field) => (
        <field.FormTextField
          label={TYPE_LABEL_MAP[registryTypeFieldValue as ContainerRegistryType] || "Registry Space"}
          tooltipText={TYPE_TITLE_MAP[registryTypeFieldValue as ContainerRegistryType] || "Specify registry space."}
          placeholder="Enter registry space"
        />
      )}
    </form.AppField>
  );
};
