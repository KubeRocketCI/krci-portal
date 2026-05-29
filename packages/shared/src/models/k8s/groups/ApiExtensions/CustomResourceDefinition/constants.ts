import { K8sResourceConfig } from "../../../common/index.js";

export const k8sCustomResourceDefinitionConfig = {
  apiVersion: "apiextensions.k8s.io/v1",
  kind: "CustomResourceDefinition",
  group: "apiextensions.k8s.io",
  version: "v1",
  singularName: "customresourcedefinition",
  pluralName: "customresourcedefinitions",
  clusterScoped: true,
} as const satisfies K8sResourceConfig;
