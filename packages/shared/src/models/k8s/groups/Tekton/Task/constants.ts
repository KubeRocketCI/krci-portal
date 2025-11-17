import { K8sResourceConfig } from "../../../common/index.js";

export const k8sTaskConfig = {
  apiVersion: "tekton.dev/v1",
  version: "v1",
  kind: "Task",
  group: "tekton.dev",
  singularName: "task",
  pluralName: "tasks",
} as const satisfies K8sResourceConfig;
