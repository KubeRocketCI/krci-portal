import { safeEncode } from "../../../../../../utils/index.js";
import z from "zod";
import { Secret } from "../../../../groups/Core/index.js";
import { editResource } from "../../../utils.js";
import {
  containerRegistryType,
  containerRegistryTypeEnum,
  DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT,
  GHCR_DEFAULT_REGISTRY_ENDPOINT,
} from "../../constants.js";
import { Draft } from "immer";

const editPullAccountRegistrySecretSchema = z.object({
  registryType: containerRegistryTypeEnum,
  registryEndpoint: z.string(),
  user: z.string(),
  password: z.string(),
});

const editPushAccountRegistrySecretSchema = z.object({
  registryType: containerRegistryTypeEnum,
  registryEndpoint: z.string(),
  user: z.string(),
  password: z.string(),
});

export const editPullAccountRegistrySecret = (
  existingSecret: Secret,
  input: z.infer<typeof editPullAccountRegistrySecretSchema>
): Secret => {
  return editResource(
    existingSecret,
    input,
    editPullAccountRegistrySecretSchema,
    (draft: Draft<Secret>, validatedInput) => {
      let registryEndpoint: string;

      if (validatedInput.registryType === containerRegistryType.dockerhub) {
        registryEndpoint = DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT;
      } else if (validatedInput.registryType === containerRegistryType.ghcr) {
        registryEndpoint = GHCR_DEFAULT_REGISTRY_ENDPOINT;
      } else {
        registryEndpoint = validatedInput.registryEndpoint;
      }

      if (!draft.data) {
        draft.data = {};
      }

      draft.data[".dockerconfigjson"] =
        safeEncode(
          JSON.stringify({
            auths: {
              [registryEndpoint]: {
                username: validatedInput.user,
                password: validatedInput.password,
                auth: safeEncode(`${validatedInput.user}:${validatedInput.password}`),
              },
            },
          })
        ) || "";
    }
  );
};

export const editPushAccountRegistrySecret = (
  existingSecret: Secret,
  input: z.infer<typeof editPushAccountRegistrySecretSchema>
): Secret => {
  return editResource(
    existingSecret,
    input,
    editPushAccountRegistrySecretSchema,
    (draft: Draft<Secret>, validatedInput) => {
      let registryEndpoint: string;

      if (validatedInput.registryType === containerRegistryType.dockerhub) {
        registryEndpoint = DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT;
      } else if (validatedInput.registryType === containerRegistryType.ghcr) {
        registryEndpoint = GHCR_DEFAULT_REGISTRY_ENDPOINT;
      } else {
        registryEndpoint = validatedInput.registryEndpoint;
      }

      if (!draft.data) {
        draft.data = {};
      }

      let dockerConfigData: Record<string, any> = {};

      switch (validatedInput.registryType) {
        case containerRegistryType.ecr:
          dockerConfigData = {
            credsStore: "ecr-login",
          };
          break;
        case containerRegistryType.dockerhub:
        case containerRegistryType.harbor:
        case containerRegistryType.ghcr:
        case containerRegistryType.nexus:
          dockerConfigData = {
            auths: {
              [registryEndpoint]: {
                username: validatedInput.user,
                password: validatedInput.password,
                auth: safeEncode(`${validatedInput.user}:${validatedInput.password}`),
              },
            },
          };
          break;
        case containerRegistryType.openshift:
          dockerConfigData = {
            auths: {
              [registryEndpoint]: {
                auth: safeEncode(validatedInput.password),
              },
            },
          };
          break;
      }

      draft.data[".dockerconfigjson"] = safeEncode(JSON.stringify(dockerConfigData)) || "";
    }
  );
};
