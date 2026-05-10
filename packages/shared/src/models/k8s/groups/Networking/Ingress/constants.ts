import { K8sResourceConfig } from "../../../common/index.js";

export const k8sIngressConfig = {
  group: "networking.k8s.io",
  version: "v1",
  apiVersion: "networking.k8s.io/v1",
  kind: "Ingress",
  singularName: "ingress",
  pluralName: "ingresses",
} as const satisfies K8sResourceConfig;
