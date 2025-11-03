import { K8sResourceConfig } from "../../../common";
import { applicationLabels } from "./labels";
import { applicationHealthStatusSchema, applicationSyncStatusSchema } from "./schema";

export const k8sApplicationConfig = {
  apiVersion: "argoproj.io/v1alpha1",
  version: "v1alpha1",
  kind: "Application",
  group: "argoproj.io",
  singularName: "application",
  pluralName: "applications",
} as const satisfies K8sResourceConfig<typeof applicationLabels>;

export const applicationHealthStatus = applicationHealthStatusSchema.enum;
export const applicationSyncStatus = applicationSyncStatusSchema.enum;
