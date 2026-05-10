import { K8sResourceConfig } from "../../../common/index.js";

export const k8sDaemonSetConfig = {
  group: "apps",
  version: "v1",
  apiVersion: "apps/v1",
  kind: "DaemonSet",
  singularName: "daemonset",
  pluralName: "daemonsets",
} as const satisfies K8sResourceConfig;
