export const EDP_CONFIG_CONFIG_MAP_NAMES = ["edp-config", "krci-config"];

export const CONTAINER_REGISTRY_PLATFORM = {
  KUBERNETES: "kubernetes",
  OPENSHIFT: "openshift",
} as const;

export const CONTAINER_REGISTRY_TYPE = {
  ECR: "ecr",
  DOCKER_HUB: "dockerhub",
  HARBOR: "harbor",
  OPENSHIFT_REGISTRY: "openshift",
  NEXUS: "nexus",
  GHCR: "ghcr",
} as const;

export const CONTAINER_REGISTRY_TYPE_LABEL_MAP = {
  [CONTAINER_REGISTRY_TYPE.ECR]: "AWS ECR",
  [CONTAINER_REGISTRY_TYPE.DOCKER_HUB]: "DockerHub",
  [CONTAINER_REGISTRY_TYPE.HARBOR]: "Harbor",
  [CONTAINER_REGISTRY_TYPE.OPENSHIFT_REGISTRY]: "OpenShift",
  [CONTAINER_REGISTRY_TYPE.NEXUS]: "Nexus",
  [CONTAINER_REGISTRY_TYPE.GHCR]: "GHCR",
};

export const CONTAINER_REGISTRY_TYPE_BY_PLATFORM = {
  [CONTAINER_REGISTRY_PLATFORM.KUBERNETES]: [
    CONTAINER_REGISTRY_TYPE.ECR,
    CONTAINER_REGISTRY_TYPE.DOCKER_HUB,
    CONTAINER_REGISTRY_TYPE.HARBOR,
    CONTAINER_REGISTRY_TYPE.NEXUS,
    CONTAINER_REGISTRY_TYPE.GHCR,
  ],
  [CONTAINER_REGISTRY_PLATFORM.OPENSHIFT]: [
    CONTAINER_REGISTRY_TYPE.ECR,
    CONTAINER_REGISTRY_TYPE.DOCKER_HUB,
    CONTAINER_REGISTRY_TYPE.HARBOR,
    CONTAINER_REGISTRY_TYPE.OPENSHIFT_REGISTRY,
    CONTAINER_REGISTRY_TYPE.NEXUS,
    CONTAINER_REGISTRY_TYPE.GHCR,
  ],
};
