import { K8sResourceConfig } from "../../../common/index.js";

export const k8sClusterRoleConfig = {
  group: "rbac.authorization.k8s.io",
  version: "v1",
  apiVersion: "rbac.authorization.k8s.io/v1",
  kind: "ClusterRole",
  singularName: "clusterrole",
  pluralName: "clusterroles",
  clusterScoped: true,
} as const satisfies K8sResourceConfig;
