import { K8sResourceConfig } from "../../../common/index.js";

export const k8sServiceAccountConfig = {
  group: "",
  version: "v1",
  apiVersion: "v1",
  kind: "ServiceAccount",
  singularName: "serviceaccount",
  pluralName: "serviceaccounts",
} as const satisfies K8sResourceConfig;
