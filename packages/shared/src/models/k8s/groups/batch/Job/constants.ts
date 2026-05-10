import { K8sResourceConfig } from "../../../common/index.js";

export const k8sJobConfig = {
  group: "batch",
  version: "v1",
  apiVersion: "batch/v1",
  kind: "Job",
  singularName: "job",
  pluralName: "jobs",
} as const satisfies K8sResourceConfig;
