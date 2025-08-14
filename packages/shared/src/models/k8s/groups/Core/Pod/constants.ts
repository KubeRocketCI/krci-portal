import { K8sResourceConfig } from "../../../core";

export const k8sPodConfig = {
  group: "",
  version: "v1",
  apiVersion: "v1",
  kind: "Pod",
  singularName: "pod",
  pluralName: "pods",
} as const satisfies K8sResourceConfig;
