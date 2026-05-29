import type { ResourceRegistry } from "./types";
import { podsDescriptor } from "./descriptors/pods";
import { deploymentsDescriptor } from "./descriptors/deployments";
import { statefulSetsDescriptor } from "./descriptors/statefulsets";
import { daemonSetsDescriptor } from "./descriptors/daemonsets";
import { jobsDescriptor } from "./descriptors/jobs";
import { cronJobsDescriptor } from "./descriptors/cronjobs";
import { horizontalPodAutoscalersDescriptor } from "./descriptors/horizontal-pod-autoscalers";
import { servicesDescriptor } from "./descriptors/services";
import { ingressesDescriptor } from "./descriptors/ingresses";
import { persistentVolumeClaimsDescriptor } from "./descriptors/persistent-volume-claims";
import { persistentVolumesDescriptor } from "./descriptors/persistent-volumes";
import { storageClassesDescriptor } from "./descriptors/storage-classes";
import { configMapsDescriptor } from "./descriptors/config-maps";
import { secretsDescriptor } from "./descriptors/secrets";
import { nodesDescriptor } from "./descriptors/nodes";
import { namespacesDescriptor } from "./descriptors/namespaces";
import { rolesDescriptor } from "./descriptors/roles";
import { roleBindingsDescriptor } from "./descriptors/role-bindings";
import { clusterRolesDescriptor } from "./descriptors/cluster-roles";
import { clusterRoleBindingsDescriptor } from "./descriptors/cluster-role-bindings";
import { crdsDescriptor } from "./descriptors/crds";

export const resourceRegistry: ResourceRegistry = {
  // Workloads — pods first to preserve sidebar order
  pods: podsDescriptor,
  deployments: deploymentsDescriptor,
  statefulsets: statefulSetsDescriptor,
  daemonsets: daemonSetsDescriptor,
  jobs: jobsDescriptor,
  cronjobs: cronJobsDescriptor,
  horizontalpodautoscalers: horizontalPodAutoscalersDescriptor,
  // Network
  services: servicesDescriptor,
  ingresses: ingressesDescriptor,
  // Storage
  persistentvolumeclaims: persistentVolumeClaimsDescriptor,
  persistentvolumes: persistentVolumesDescriptor,
  storageclasses: storageClassesDescriptor,
  // Config
  configmaps: configMapsDescriptor,
  secrets: secretsDescriptor,
  // Cluster — nodes first to preserve sidebar order
  nodes: nodesDescriptor,
  namespaces: namespacesDescriptor,
  // Security
  roles: rolesDescriptor,
  rolebindings: roleBindingsDescriptor,
  clusterroles: clusterRolesDescriptor,
  clusterrolebindings: clusterRoleBindingsDescriptor,
  // Custom Resources
  customresourcedefinitions: crdsDescriptor,
} as const;
