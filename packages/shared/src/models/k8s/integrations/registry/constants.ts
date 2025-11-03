import z from "zod";

export const registrySecretNameEnum = z.enum(["kaniko-docker-config", "regcred"]);

export const registrySecretName = registrySecretNameEnum.enum;

export type RegistrySecretName = z.infer<typeof registrySecretNameEnum>;

export const containerRegistryPlatformEnum = z.enum(["kubernetes", "openshift"]);

export const containerRegistryPlatform = containerRegistryPlatformEnum.enum;

export type ContainerRegistryPlatform = z.infer<typeof containerRegistryPlatformEnum>;

export const containerRegistryTypeEnum = z.enum(["ecr", "dockerhub", "harbor", "openshift", "nexus", "ghcr"]);

export const containerRegistryType = containerRegistryTypeEnum.enum;

export type ContainerRegistryType = z.infer<typeof containerRegistryTypeEnum>;

export const containerRegistryTypeLabelMap = {
  [containerRegistryType.ecr]: "AWS ECR",
  [containerRegistryType.dockerhub]: "DockerHub",
  [containerRegistryType.harbor]: "Harbor",
  [containerRegistryType.openshift]: "OpenShift",
  [containerRegistryType.nexus]: "Nexus",
  [containerRegistryType.ghcr]: "GHCR",
};

export const containerRegistryTypeByPlatform = {
  [containerRegistryPlatform.kubernetes]: [
    containerRegistryType.ecr,
    containerRegistryType.dockerhub,
    containerRegistryType.harbor,
    containerRegistryType.nexus,
    containerRegistryType.ghcr,
  ],
  [containerRegistryPlatform.openshift]: [
    containerRegistryType.ecr,
    containerRegistryType.dockerhub,
    containerRegistryType.harbor,
    containerRegistryType.openshift,
    containerRegistryType.nexus,
    containerRegistryType.ghcr,
  ],
};

export const IRSA_ROLE_ARN_ANNOTATION = "eks.amazonaws.com/role-arn";
export const DOCKER_HUB_DEFAULT_REGISTRY_ENDPOINT = "https://index.docker.io/v1/";
export const GHCR_DEFAULT_REGISTRY_ENDPOINT = "https://ghcr.io";
