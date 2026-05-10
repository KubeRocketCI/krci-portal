import { K8sResourceConfig } from "../../../common/index.js";

export const k8sStorageClassConfig = {
  group: "storage.k8s.io",
  version: "v1",
  apiVersion: "storage.k8s.io/v1",
  kind: "StorageClass",
  singularName: "storageclass",
  pluralName: "storageclasses",
  clusterScoped: true,
} as const satisfies K8sResourceConfig;
