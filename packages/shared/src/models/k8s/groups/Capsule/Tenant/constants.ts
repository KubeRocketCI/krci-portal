import { K8sResourceConfig } from "../../../common/index.js";

export const k8sTenantConfig = {
  apiVersion: "capsule.clastix.io/v1beta2",
  group: "capsule.clastix.io",
  version: "v1beta2",
  kind: "Tenant",
  singularName: "tenant",
  pluralName: "tenants",
} as const satisfies K8sResourceConfig;
