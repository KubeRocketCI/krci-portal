import { K8sResourceConfig } from "../../../common/index.js";

export const k8sTriggerConfig = {
  apiVersion: "triggers.tekton.dev/v1beta1",
  version: "v1beta1",
  kind: "Trigger",
  group: "triggers.tekton.dev",
  singularName: "trigger",
  pluralName: "triggers",
} as const satisfies K8sResourceConfig;
