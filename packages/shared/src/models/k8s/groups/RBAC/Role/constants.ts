import { K8sResourceConfig } from "../../../common/index.js";

export const k8sRoleConfig = {
  group: "rbac.authorization.k8s.io",
  version: "v1",
  apiVersion: "rbac.authorization.k8s.io/v1",
  kind: "Role",
  singularName: "role",
  pluralName: "roles",
} as const satisfies K8sResourceConfig;
