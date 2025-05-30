import { K8sResourceConfig } from "../../../core";

export const k8sSecretConfig = {
  group: "v1",
  version: "v1",
  apiVersion: "v1",
  kind: "Secret",
  singularName: "secret",
  pluralName: "secrets",
} as const satisfies K8sResourceConfig;
