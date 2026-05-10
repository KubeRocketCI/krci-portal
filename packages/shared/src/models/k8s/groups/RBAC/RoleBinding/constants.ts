import { K8sResourceConfig } from "../../../common/index.js";

export const k8sRoleBindingConfig = {
  group: "rbac.authorization.k8s.io",
  version: "v1",
  apiVersion: "rbac.authorization.k8s.io/v1",
  kind: "RoleBinding",
  singularName: "rolebinding",
  pluralName: "rolebindings",
} as const satisfies K8sResourceConfig;
