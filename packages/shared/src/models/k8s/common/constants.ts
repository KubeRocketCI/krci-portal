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
  [k8sOperation.patch]: rbacOperation.patch,
  [k8sOperation.connect]: rbacOperation.connect,
  [k8sOperation.replace]: rbacOperation.update,
};

export const rbacToK8sVerbMap: Record<RBACOperation, K8sOperation> = {
  [rbacOperation.get]: k8sOperation.read,
  [rbacOperation.list]: k8sOperation.read,
  [rbacOperation.watch]: k8sOperation.read,
  [rbacOperation.create]: k8sOperation.create,
  [rbacOperation.update]: k8sOperation.patch,
  [rbacOperation.patch]: k8sOperation.patch,
  [rbacOperation.delete]: k8sOperation.delete,
  [rbacOperation.deletecollection]: k8sOperation.delete,
  [rbacOperation.connect]: k8sOperation.connect,
};

export const defaultPermissionsToCheck = [k8sOperation.create, k8sOperation.patch, k8sOperation.delete] as const;

export const defaultPermissions = {
  [k8sOperation.create]: {
    allowed: false,
    reason: `You cannot create resources of this kind. Permission check result has not been received yet.`,
  },
  [k8sOperation.patch]: {
    allowed: false,
    reason: `You cannot update resources of this kind. Permission check result has not been received yet.`,
  },
  [k8sOperation.delete]: {
    allowed: false,
    reason: `You cannot delete resources of this kind. Permission check result has not been received yet.`,
  },
};
