import { K8sResourceConfig } from "../../../common/index.js";

export const k8sGatewayConfig = {
  group: "gateway.networking.k8s.io",
  version: "v1",
  apiVersion: "gateway.networking.k8s.io/v1",
  kind: "Gateway",
  singularName: "gateway",
  pluralName: "gateways",
} as const satisfies K8sResourceConfig;
