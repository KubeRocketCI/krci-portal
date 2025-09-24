import { K8sResourceConfig } from "../../../common";

export const k8sSecretConfig = {
  group: "",
  version: "v1",
  apiVersion: "v1",
  kind: "Secret",
  singularName: "secret",
  pluralName: "secrets",
} as const satisfies K8sResourceConfig;
