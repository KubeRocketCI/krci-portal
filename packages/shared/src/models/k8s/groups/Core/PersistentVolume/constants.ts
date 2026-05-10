import { K8sResourceConfig } from "../../../common/index.js";

export const k8sPersistentVolumeConfig = {
  group: "",
  version: "v1",
  apiVersion: "v1",
  kind: "PersistentVolume",
  singularName: "persistentvolume",
  pluralName: "persistentvolumes",
  clusterScoped: true,
} as const satisfies K8sResourceConfig;
