import { k8sOperationEnum, rbacOperationEnum } from "./schema.js";
import { K8sOperation, RBACOperation } from "./types.js";

export const inClusterName = "in-cluster";

export const k8sOperation = k8sOperationEnum.enum;
export const rbacOperation = rbacOperationEnum.enum;

export const k8sToRbacVerbMap: Record<K8sOperation, RBACOperation> = {
  [k8sOperation.list]: rbacOperation.list,
  [k8sOperation.read]: rbacOperation.get,
  [k8sOperation.create]: rbacOperation.create,
  [k8sOperation.delete]: rbacOperation.delete,
  [k8sOperation.update]: rbacOperation.update,
  [k8sOperation.patch]: rbacOperation.patch,
  [k8sOperation.connect]: rbacOperation.connect,
  [k8sOperation.replace]: rbacOperation.update,
};

export const rbacToK8sVerbMap: Record<RBACOperation, K8sOperation> = {
  [rbacOperation.get]: k8sOperation.read,
  [rbacOperation.list]: k8sOperation.read,
  [rbacOperation.watch]: k8sOperation.read,
  [rbacOperation.create]: k8sOperation.create,
  [rbacOperation.update]: k8sOperation.update,
  [rbacOperation.patch]: k8sOperation.update,
  [rbacOperation.delete]: k8sOperation.delete,
  [rbacOperation.deletecollection]: k8sOperation.delete,
  [rbacOperation.connect]: k8sOperation.connect,
};

export const defaultPermissionsToCheck = [
  k8sOperation.create,
  k8sOperation.update,
  k8sOperation.patch,
  k8sOperation.delete,
] as const;

/**
 * API groups that are built in or aggregated (not CRD-backed). Excluded from the
 * permission-derived "Custom Resources" catalog so it lists only custom resources,
 * matching the admin CRD-watch behaviour.
 */
export const BUILTIN_API_GROUPS = new Set<string>([
  "", // core
  "apps",
  "batch",
  "autoscaling",
  "policy",
  "extensions",
  "networking.k8s.io",
  "discovery.k8s.io",
  "coordination.k8s.io",
  "node.k8s.io",
  "events.k8s.io",
  "certificates.k8s.io",
  "rbac.authorization.k8s.io",
  "scheduling.k8s.io",
  "storage.k8s.io",
  "admissionregistration.k8s.io",
  "apiextensions.k8s.io",
  "apiregistration.k8s.io",
  "authentication.k8s.io",
  "authorization.k8s.io",
  "flowcontrol.apiserver.k8s.io",
  "internal.apiserver.k8s.io",
  "metrics.k8s.io",
  "resource.k8s.io",
  "storagemigration.k8s.io",
]);

/** RBAC verbs that imply the user can MODIFY a resource (drives AccessibleCustomResource.editable). */
export const CR_WRITE_VERBS = new Set<string>([
  rbacOperation.create,
  rbacOperation.update,
  rbacOperation.patch,
  rbacOperation.delete,
  rbacOperation.deletecollection,
  "*",
]);

export const defaultPermissions = {
  [k8sOperation.create]: {
    allowed: false,
    reason: `You cannot create resources of this kind. Permission check result has not been received yet.`,
  },
  [k8sOperation.update]: {
    allowed: false,
    reason: `You cannot update resources of this kind. Permission check result has not been received yet.`,
  },
  [k8sOperation.patch]: {
    allowed: false,
    reason: `You cannot patch resources of this kind. Permission check result has not been received yet.`,
  },
  [k8sOperation.delete]: {
    allowed: false,
    reason: `You cannot delete resources of this kind. Permission check result has not been received yet.`,
  },
};
