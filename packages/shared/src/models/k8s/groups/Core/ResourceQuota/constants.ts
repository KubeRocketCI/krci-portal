import { K8sResourceConfig } from "../../../common/index.js";

export const k8sResourceQuotaConfig = {
  group: "",
  version: "v1",
  apiVersion: "v1",
  kind: "ResourceQuota",
  singularName: "resourcequota",
  pluralName: "resourcequotas",
} as const satisfies K8sResourceConfig;

// Capsule >= 0.14 sets this label on the ResourceQuotas it manages.
export const RESOURCE_QUOTA_LABEL_TENANT = "projectcapsule.dev/tenant";

// Capsule < 0.14 sets this label; Capsule >= 0.14 removes it.
export const RESOURCE_QUOTA_LABEL_TENANT_LEGACY = "capsule.clastix.io/tenant";
