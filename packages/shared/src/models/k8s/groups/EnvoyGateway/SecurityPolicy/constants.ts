import { K8sResourceConfig } from "../../../common/index.js";

export const k8sSecurityPolicyConfig = {
  group: "gateway.envoyproxy.io",
  version: "v1alpha1",
  apiVersion: "gateway.envoyproxy.io/v1alpha1",
  kind: "SecurityPolicy",
  singularName: "securitypolicy",
  pluralName: "securitypolicies",
} as const satisfies K8sResourceConfig;
