import { K8sResourceConfig } from "../../../common/index.js";

export const k8sPersistentVolumeClaimConfig = {
  group: "",
  version: "v1",
  apiVersion: "v1",
  kind: "PersistentVolumeClaim",
  singularName: "persistentvolumeclaim",
  pluralName: "persistentvolumeclaims",
} as const satisfies K8sResourceConfig;
