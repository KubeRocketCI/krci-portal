import { K8sResourceConfig } from "../../../common/index.js";

export const k8sCronJobConfig = {
  group: "batch",
  version: "v1",
  apiVersion: "batch/v1",
  kind: "CronJob",
  singularName: "cronjob",
  pluralName: "cronjobs",
} as const satisfies K8sResourceConfig;
