import { K8sResourceConfig } from "../../../common/index.js";

export const k8sDeploymentConfig = {
  group: "apps",
  version: "v1",
  apiVersion: "apps/v1",
  kind: "Deployment",
  singularName: "deployment",
  pluralName: "deployments",
} as const satisfies K8sResourceConfig;
