import {
  parseConfigJson,
  safeDecode,
  safeEncode,
} from "../../../../../../utils";
import z, { ZodError } from "zod";
import {
  Secret,
  SecretDraft,
  secretDraftSchema,
} from "../../../../groups/Core";
import {
  SECRET_LABEL_SECRET_TYPE,
  SECRET_LABEL_INTEGRATION_SECRET,
} from "../../../constants";
import {
  containerRegistryType,
  containerRegistryTypeEnum,
  registrySecretName,
  DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT,
  GHCR_DEFAULT_REGISTRY_ENDPOINT,
} from "../../constants";

export const parseRegistrySecretUserProtectedData = (
  secret: Secret | undefined
): { userName: string | undefined; password: string | undefined } => {
  const fallbackValue = { userName: undefined, password: undefined };
  if (!secret) {
    return fallbackValue;
  }

  const configJson = secret?.data?.[".dockerconfigjson"];

  if (!configJson) {
    return fallbackValue;
  }

  const parsedConfigJson = parseConfigJson(configJson);

  if (!parsedConfigJson?.auths) {
    // there is no auths field in ECR kaniko-docker-config secret
    return fallbackValue;
  }
  const authEntry = Object.values(parsedConfigJson?.auths)[0] as {
    username?: string;
    password?: string;
  };
  const userName = authEntry?.username;
  const password = authEntry?.password;
  return { userName, password };
};

export const parseRegistrySecretAuth = (secret: Secret | undefined) => {
  const fallbackValue = { auth: undefined };
  if (!secret) {
    return fallbackValue;
  }

  const configJson = secret?.data?.[".dockerconfigjson"];

  if (!configJson) {
    return fallbackValue;
  }

  const parsedConfigJson = parseConfigJson(configJson);

  if (!parsedConfigJson?.auths) {
    // there is no auths field in ECR kaniko-docker-config secret
    return fallbackValue;
  }

  const auth = (Object.values(parsedConfigJson.auths)[0] as { auth?: string })
    ?.auth;

  return { auth };
};

const createPullAccountRegistrySecretDraftSchema = z.object({
  registryType: containerRegistryTypeEnum,
  registryEndpoint: z.string(),
  user: z.string(),
  password: z.string(),
});

export const createPullAccountRegistrySecretDraft = (
  input: z.infer<typeof createPullAccountRegistrySecretDraftSchema>
): SecretDraft => {
  const parsedInput =
    createPullAccountRegistrySecretDraftSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  let registryEndpoint: string;

  if (input.registryType === containerRegistryType.dockerhub) {
    registryEndpoint = DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT;
  } else if (input.registryType === containerRegistryType.ghcr) {
    registryEndpoint = GHCR_DEFAULT_REGISTRY_ENDPOINT;
  } else {
    registryEndpoint = input.registryEndpoint;
  }

  const draft: SecretDraft = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: registrySecretName.regcred,
      labels: {
        [SECRET_LABEL_SECRET_TYPE]: "registry",
        [SECRET_LABEL_INTEGRATION_SECRET]: "true",
      },
    },
    type: "kubernetes.io/dockerconfigjson",
    data: {
      ".dockerconfigjson":
        safeEncode(
          JSON.stringify({
            auths: {
              [registryEndpoint]: {
                username: input.user,
                password: input.password,
                auth: safeEncode(`${input.user}:${input.password}`),
              },
            },
          })
        ) || "",
    },
  };

  const parsedDraft = secretDraftSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};

const createPushAccountRegistrySecretDraftSchema = z.object({
  registryType: containerRegistryTypeEnum,
  registryEndpoint: z.string(),
  user: z.string(),
  password: z.string(),
});

export const createPushAccountRegistrySecretDraft = (
  input: z.infer<typeof createPushAccountRegistrySecretDraftSchema>
): SecretDraft => {
  const parsedInput =
    createPushAccountRegistrySecretDraftSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  let registryEndpoint: string;

  if (input.registryType === containerRegistryType.dockerhub) {
    registryEndpoint = DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT;
  } else if (input.registryType === containerRegistryType.ghcr) {
    registryEndpoint = GHCR_DEFAULT_REGISTRY_ENDPOINT;
  } else {
    registryEndpoint = input.registryEndpoint;
  }

  let data: Record<string, string> = {};

  switch (input.registryType) {
    case containerRegistryType.ecr:
      data = {
        ".dockerconfigjson":
          safeEncode(
            JSON.stringify({
              credsStore: "ecr-login",
            })
          ) || "",
      };
      break;
    case containerRegistryType.dockerhub:
    case containerRegistryType.harbor:
    case containerRegistryType.ghcr:
    case containerRegistryType.nexus:
      data = {
        ".dockerconfigjson":
          safeEncode(
            JSON.stringify({
              auths: {
                [registryEndpoint]: {
                  username: input.user,
                  password: input.password,
                  auth: safeEncode(`${input.user}:${input.password}`),
                },
              },
            })
          ) || "",
      };
      break;
    case containerRegistryType.openshift:
      data = {
        ".dockerconfigjson":
          safeEncode(
            JSON.stringify({
              auths: {
                [registryEndpoint]: {
                  auth: safeEncode(input.password),
                },
              },
            })
          ) || "",
      };
      break;
  }

  const draft: SecretDraft = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: registrySecretName["kaniko-docker-config"],
      labels: {
        [SECRET_LABEL_SECRET_TYPE]: "registry",
        [SECRET_LABEL_INTEGRATION_SECRET]: "true",
      },
    },
    type: "kubernetes.io/dockerconfigjson",
    data: data,
  };

  const parsedDraft = secretDraftSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
