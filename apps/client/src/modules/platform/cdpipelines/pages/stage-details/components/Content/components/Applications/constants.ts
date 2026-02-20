export const applicationTableMode = {
  preview: "preview",
  configuration: "configuration",
} as const;

export const columnNames = {
  HEALTH: "health",
  SYNC: "sync",
  STATUS: "status",
  NAME: "name",
  DEPLOYED_VERSION: "deployedVersion",
  VALUES_OVERRIDE: "valuesOverride",
  PODS: "pods",
  INGRESS: "ingress",
  EMPTY: "empty",
} as const;
