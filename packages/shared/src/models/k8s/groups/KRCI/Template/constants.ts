import { K8sResourceConfig } from "../../../common";

export const k8sTemplateConfig = {
  apiVersion: "v2.edp.epam.com/v1alpha1",
  version: "v1alpha1",
  kind: "Template",
  group: "v2.edp.epam.com",
  singularName: "template",
  pluralName: "templates",
} as const satisfies K8sResourceConfig;
