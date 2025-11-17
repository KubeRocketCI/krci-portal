import z from "zod";
import { ConfigMap } from "../../../../groups/Core/index.js";
import { editResource } from "../../../utils.js";
import { containerRegistryType } from "../../constants.js";
import { Draft } from "immer";

const editKRCIConfigMapRegistryDataSchema = z.discriminatedUnion("registryType", [
  z.object({
    registryType: z.literal(containerRegistryType.ecr),
    registrySpace: z.string(),
    awsRegion: z.string(),
    registryEndpoint: z.string(),
  }),

  z.object({
    registryType: z.literal(containerRegistryType.ghcr),
    registrySpace: z.string(),
  }),

  z.object({
    registryType: z.literal(containerRegistryType.dockerhub),
    registrySpace: z.string(),
  }),

  z.object({
    registryType: z.literal(containerRegistryType.harbor),
    registrySpace: z.string(),
    registryEndpoint: z.string(),
  }),

  z.object({
    registryType: z.literal(containerRegistryType.openshift),
    registrySpace: z.string(),
    registryEndpoint: z.string(),
  }),

  z.object({
    registryType: z.literal(containerRegistryType.nexus),
    registrySpace: z.string(),
    registryEndpoint: z.string(),
  }),
]);

export const editKRCIConfigMapRegistryData = (
  configMap: ConfigMap,
  input: z.infer<typeof editKRCIConfigMapRegistryDataSchema>
): ConfigMap => {
  return editResource(
    configMap,
    input,
    editKRCIConfigMapRegistryDataSchema,
    (draft: Draft<ConfigMap>, validatedInput) => {
      // Initialize data if it doesn't exist
      if (!draft.data) {
        draft.data = {};
      }

      // Update base values
      draft.data.container_registry_space = validatedInput.registrySpace;
      draft.data.container_registry_type = validatedInput.registryType;

      // Update type-specific values
      switch (validatedInput.registryType) {
        case containerRegistryType.ecr:
          draft.data.container_registry_host = validatedInput.registryEndpoint;
          draft.data.aws_region = validatedInput.awsRegion;
          break;
        case containerRegistryType.ghcr:
          draft.data.container_registry_host = "ghcr.io";
          break;
        case containerRegistryType.dockerhub:
          draft.data.container_registry_host = "docker.io";
          break;
        case containerRegistryType.harbor:
          draft.data.container_registry_host = validatedInput.registryEndpoint;
          break;
        case containerRegistryType.openshift:
          draft.data.container_registry_host = validatedInput.registryEndpoint;
          break;
        case containerRegistryType.nexus:
          draft.data.container_registry_host = validatedInput.registryEndpoint;
          break;
      }
    }
  );
};
