import { K8sResourceConfig } from "../../../common";

export const k8sResourceQuotaConfig = {
  group: "",
  version: "v1",
  apiVersion: "v1",
  kind: "ResourceQuota",
  singularName: "resourcequota",
  pluralName: "resourcequotas",
} as const satisfies K8sResourceConfig;

export const RESOURCE_QUOTA_LABEL_TENANT = "capsule.clastix.io/tenant";
