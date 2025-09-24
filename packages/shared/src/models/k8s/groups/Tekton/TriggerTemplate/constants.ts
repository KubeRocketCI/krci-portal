import { K8sResourceConfig } from "../../../common";

export const k8sTriggerTemplateConfig = {
  apiVersion: "triggers.tekton.dev/v1beta1",
  version: "v1beta1",
  kind: "TriggerTemplate",
  group: "triggers.tekton.dev",
  singularName: "triggertemplate",
  pluralName: "triggertemplates",
} as const satisfies K8sResourceConfig;
