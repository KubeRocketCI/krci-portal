import { K8sResourceConfig } from "../../../common/index.js";

export const k8sClusterRoleBindingConfig = {
  group: "rbac.authorization.k8s.io",
  version: "v1",
  apiVersion: "rbac.authorization.k8s.io/v1",
  kind: "ClusterRoleBinding",
  singularName: "clusterrolebinding",
  pluralName: "clusterrolebindings",
  clusterScoped: true,
} as const satisfies K8sResourceConfig;
