import z from "zod";
import { defaultPermissionsToCheck, k8sOperation, rbacOperation } from "./constants.js";
import {
  k8sResourceConfigSchema,
  kubeManagedFieldsEntrySchema,
  kubeObjectBaseDraftSchema,
  kubeObjectBaseSchema,
  kubeObjectDraftMetadataSchema,
  KubeObjectListBaseSchema,
  kubeObjectMetadataSchema,
} from "./schema.js";
import { ValueOf } from "../../../utils/types.js";

export type KubeManagedFieldsEntry = z.infer<typeof kubeManagedFieldsEntrySchema>;

export type KubeCreationMetadata = z.infer<typeof kubeObjectDraftMetadataSchema>;

export type KubeObjectDraft = z.infer<typeof kubeObjectBaseDraftSchema>;

export type KubeMetadata = z.infer<typeof kubeObjectMetadataSchema>;

export type KubeObjectBase = z.infer<typeof kubeObjectBaseSchema>;

export type KubeObjectListBase<T extends KubeObjectBase> = z.infer<typeof KubeObjectListBaseSchema> & {
  items: T[];
};

export type ResourceLabels = Record<string, string> | undefined;

// Canonical K8s condition status values. Typed as `string` on KubeCondition
// because runtime conditions extracted from arbitrary K8s resources may report
// non-spec values, and a strict union would force casts at every consumer.
export const KUBE_CONDITION_STATUS = {
  True: "True",
  False: "False",
  Unknown: "Unknown",
} as const;

export interface KubeCondition {
  type: string;
  status: string;
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
}

export interface K8sResourceConfig<Labels extends ResourceLabels = ResourceLabels> extends z.infer<
  typeof k8sResourceConfigSchema
> {
  labels?: Labels;
}

export type DefaultPermissionListCheckResult = Record<
  (typeof defaultPermissionsToCheck)[number],
  {
    allowed: boolean;
    reason: string;
  }
>;

export type K8sOperation = ValueOf<typeof k8sOperation>;
export type RBACOperation = ValueOf<typeof rbacOperation>;

/**
 * A custom-resource TYPE the signed-in user can access, derived from
 * SelfSubjectRulesReview ∩ API discovery. Powers the permission-aware
 * "Custom Resources" catalog for users who cannot list CRDs cluster-wide.
 */
export interface AccessibleCustomResource {
  /** API group, e.g. "v2.edp.epam.com" */
  group: string;
  /**
   * Served version from discovery, e.g. "v1" — the group's preferred version when
   * the type is served there, otherwise the highest-priority version serving it.
   */
  version: string;
  /** Resource plural, e.g. "codebasebranches" */
  plural: string;
  /** Kind from discovery, e.g. "CodebaseBranch" */
  kind: string;
  /** Singular name from discovery; falls back to the lowercase kind when discovery omits it */
  singular: string;
  /** Scope from discovery */
  namespaced: boolean;
  /** User's RBAC verbs from the rules review, e.g. ["*"] or ["get", "list", "watch"] */
  verbs: string[];
  /**
   * Whether `verbs` includes a write verb (see CR_WRITE_VERBS). Informational —
   * the client gates editing with per-resource SelfSubjectAccessReview
   * (usePermissions), which stays the authoritative source.
   */
  editable: boolean;
}
