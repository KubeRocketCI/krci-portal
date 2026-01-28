import { useStore } from "@tanstack/react-form";
import { ContainerRegistryType, containerRegistryType } from "@my-project/shared";
import { useManageRegistryForm } from "../../../../providers/form/hooks";
import { NAMES } from "../../../../schema";

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
  const form = useManageRegistryForm();

  const registryTypeFieldValue = useStore(form.store, (state) => state.values[NAMES.REGISTRY_TYPE]);

  return (
    <form.AppField name={NAMES.REGISTRY_ENDPOINT}>
      {(field) => (
        <field.FormTextField
          label="Registry Endpoint"
          placeholder="Enter registry endpoint"
          tooltipText={
            TYPE_TITLE_MAP[registryTypeFieldValue as ContainerRegistryType] || "Enter registry endpoint URL."
          }
          disabled={
            registryTypeFieldValue === containerRegistryType.dockerhub ||
            registryTypeFieldValue === containerRegistryType.ghcr
          }
        />
      )}
    </form.AppField>
  );
};
