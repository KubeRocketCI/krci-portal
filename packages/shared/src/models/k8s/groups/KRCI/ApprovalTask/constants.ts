import { K8sResourceConfig } from "../../../core";

export const k8sApprovalTaskConfig = {
  apiVersion: "edp.epam.com/v1alpha1",
  version: "v1alpha1",
  kind: "ApprovalTask",
  group: "edp.epam.com",
  singularName: "approvaltask",
  pluralName: "approvaltasks",
} as const satisfies K8sResourceConfig;
