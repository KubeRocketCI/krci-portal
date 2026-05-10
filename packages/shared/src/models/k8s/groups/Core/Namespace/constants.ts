import { K8sResourceConfig } from "../../../common/index.js";

export const k8sNamespaceConfig = {
  group: "",
  version: "v1",
  apiVersion: "v1",
  kind: "Namespace",
  singularName: "namespace",
  pluralName: "namespaces",
  clusterScoped: true,
} as const satisfies K8sResourceConfig;
