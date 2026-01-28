export const FORM_NAMES = {
  SHARED: "shared",
  CONFIG_MAP: "configMap",
  SERVICE_ACCOUNT: "serviceAccount",
  PUSH_ACCOUNT: "pushAccount",
  PULL_ACCOUNT: "pullAccount",
} as const;

export const SHARED_FORM_NAMES = {
  REGISTRY_TYPE: "registryType",
  REGISTRY_ENDPOINT: "registryEndpoint",
  USE_SAME_ACCOUNT: "useSameAccount",
} as const;

export const CONFIG_MAP_FORM_NAMES = {
  REGISTRY_TYPE: "registryType",
  REGISTRY_ENDPOINT: "registryEndpoint",
  REGISTRY_SPACE: "registrySpace",
  AWS_REGION: "awsRegion",
} as const;

export const SERVICE_ACCOUNT_FORM_NAMES = {
  IRSA_ROLE_ARN: "irsaRoleArn",
} as const;

export const PUSH_ACCOUNT_FORM_NAMES = {
  PUSH_ACCOUNT_USER: "pushAccountUser",
  PUSH_ACCOUNT_PASSWORD: "pushAccountPassword",
} as const;

export const PULL_ACCOUNT_FORM_NAMES = {
  PULL_ACCOUNT_USER: "pullAccountUser",
  PULL_ACCOUNT_PASSWORD: "pullAccountPassword",
} as const;
