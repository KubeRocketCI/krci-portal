import { K8sResourceConfig } from "../../../common/index.js";
import { applicationLabels } from "./labels.js";
import { applicationHealthStatusSchema, applicationSyncStatusSchema } from "./schema.js";

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
