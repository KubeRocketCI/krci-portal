import { K8sResourceConfig } from "../../../common/index.js";

export const k8sConfigMapConfig = {
  group: "",
  version: "v1",
  apiVersion: "v1",
  kind: "ConfigMap",
  singularName: "configmap",
  pluralName: "configmaps",
} as const satisfies K8sResourceConfig;
