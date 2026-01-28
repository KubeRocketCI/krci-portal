import type { K8sResourceConfig } from "@my-project/shared";

/**
 * Cluster-scoped core Kubernetes resources (no namespace in URL)
 * Used when building Kubernetes API URLs to determine if namespace should be included
 */
export const CLUSTER_SCOPED_CORE_RESOURCES = new Set([
  "Node",
  "PersistentVolume",
  "ClusterRole",
  "ClusterRoleBinding",
  "Namespace",
]);

/**
 * Determines if a resource configuration represents a core Kubernetes resource
 * Core resources use /api/v1 instead of /apis/group/version
 */
export function isCoreKubernetesResource(resourceConfig: K8sResourceConfig): boolean {
  return resourceConfig.group === "";
}
