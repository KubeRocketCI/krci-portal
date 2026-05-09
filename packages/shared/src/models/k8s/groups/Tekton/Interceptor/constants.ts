import { K8sResourceConfig } from "../../../common/index.js";

export const k8sInterceptorConfig = {
  apiVersion: "triggers.tekton.dev/v1alpha1",
  version: "v1alpha1",
  kind: "Interceptor",
  group: "triggers.tekton.dev",
  singularName: "interceptor",
  pluralName: "interceptors",
} as const satisfies K8sResourceConfig;
