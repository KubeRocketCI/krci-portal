import { K8sResourceConfig } from "../../../core";

export const k8sConfigMapConfig = {
  group: "v1",
  version: "v1",
  apiVersion: "v1",
  kind: "ConfigMap",
  singularName: "configmap",
  pluralName: "configmaps",
} as const satisfies K8sResourceConfig;
