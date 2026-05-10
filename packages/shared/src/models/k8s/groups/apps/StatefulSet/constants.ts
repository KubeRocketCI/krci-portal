import { K8sResourceConfig } from "../../../common/index.js";

export const k8sStatefulSetConfig = {
  group: "apps",
  version: "v1",
  apiVersion: "apps/v1",
  kind: "StatefulSet",
  singularName: "statefulset",
  pluralName: "statefulsets",
} as const satisfies K8sResourceConfig;
