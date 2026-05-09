import { K8sResourceConfig } from "../../../common/index.js";

export const k8sTriggerBindingConfig = {
  apiVersion: "triggers.tekton.dev/v1beta1",
  version: "v1beta1",
  kind: "TriggerBinding",
  group: "triggers.tekton.dev",
  singularName: "triggerbinding",
  pluralName: "triggerbindings",
} as const satisfies K8sResourceConfig;
