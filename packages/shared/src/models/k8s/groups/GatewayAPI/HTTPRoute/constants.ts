import { K8sResourceConfig } from "../../../common/index.js";

export const k8sHTTPRouteConfig = {
  group: "gateway.networking.k8s.io",
  version: "v1",
  apiVersion: "gateway.networking.k8s.io/v1",
  kind: "HTTPRoute",
  singularName: "httproute",
  pluralName: "httproutes",
} as const satisfies K8sResourceConfig;
