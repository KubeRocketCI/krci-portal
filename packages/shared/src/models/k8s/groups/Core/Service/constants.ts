import { K8sResourceConfig } from "../../../common/index.js";

export const k8sServiceConfig = {
  group: "",
  version: "v1",
  apiVersion: "v1",
  kind: "Service",
  singularName: "service",
  pluralName: "services",
} as const satisfies K8sResourceConfig;
