import { K8sResourceConfig } from "../../../common/index.js";

export const k8sClusterInterceptorConfig = {
  apiVersion: "triggers.tekton.dev/v1alpha1",
  version: "v1alpha1",
  kind: "ClusterInterceptor",
  group: "triggers.tekton.dev",
  singularName: "clusterinterceptor",
  pluralName: "clusterinterceptors",
  clusterScoped: true,
} as const satisfies K8sResourceConfig;
