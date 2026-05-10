import { K8sResourceConfig } from "../../../common/index.js";

export const k8sNodeConfig = {
  group: "",
  version: "v1",
  apiVersion: "v1",
  kind: "Node",
  singularName: "node",
  pluralName: "nodes",
  clusterScoped: true,
} as const satisfies K8sResourceConfig;
