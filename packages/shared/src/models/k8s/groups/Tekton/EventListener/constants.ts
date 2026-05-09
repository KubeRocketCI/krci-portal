import { K8sResourceConfig } from "../../../common/index.js";

export const k8sEventListenerConfig = {
  apiVersion: "triggers.tekton.dev/v1beta1",
  version: "v1beta1",
  kind: "EventListener",
  group: "triggers.tekton.dev",
  singularName: "eventlistener",
  pluralName: "eventlisteners",
} as const satisfies K8sResourceConfig;
