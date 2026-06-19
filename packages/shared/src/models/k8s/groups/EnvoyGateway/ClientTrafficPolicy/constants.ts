import { K8sResourceConfig } from "../../../common/index.js";

export const k8sClientTrafficPolicyConfig = {
  group: "gateway.envoyproxy.io",
  version: "v1alpha1",
  apiVersion: "gateway.envoyproxy.io/v1alpha1",
  kind: "ClientTrafficPolicy",
  singularName: "clienttrafficpolicy",
  pluralName: "clienttrafficpolicies",
} as const satisfies K8sResourceConfig;
