import { K8sResourceConfig } from "../../../common/index.js";

export const k8sBackendTrafficPolicyConfig = {
  group: "gateway.envoyproxy.io",
  version: "v1alpha1",
  apiVersion: "gateway.envoyproxy.io/v1alpha1",
  kind: "BackendTrafficPolicy",
  singularName: "backendtrafficpolicy",
  pluralName: "backendtrafficpolicies",
} as const satisfies K8sResourceConfig;
