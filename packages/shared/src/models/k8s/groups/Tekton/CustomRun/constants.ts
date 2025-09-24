import { K8sResourceConfig } from "../../../common";

export const k8sCustomRunConfig = {
  apiVersion: "tekton.dev/v1beta1",
  version: "v1beta1",
  kind: "CustomRun",
  group: "tekton.dev",
  singularName: "customrun",
  pluralName: "customruns",
} as const satisfies K8sResourceConfig;
