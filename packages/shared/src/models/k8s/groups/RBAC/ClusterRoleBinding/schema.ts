import { z } from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";

const subjectSchema = z
  .object({
    kind: z.string(),
    name: z.string(),
    namespace: z.string().optional(),
    apiGroup: z.string().optional(),
  })
  .passthrough();

const roleRefSchema = z
  .object({
    apiGroup: z.string(),
    kind: z.string(),
    name: z.string(),
  })
  .passthrough();

export const clusterRoleBindingSchema = kubeObjectBaseSchema
  .extend({
    kind: z.literal("ClusterRoleBinding"),
    apiVersion: z.literal("rbac.authorization.k8s.io/v1"),
    metadata: kubeObjectMetadataSchema,
    subjects: z.array(subjectSchema).optional(),
    roleRef: roleRefSchema,
  })
  .passthrough();

export const clusterRoleBindingDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("ClusterRoleBinding"),
  apiVersion: z.literal("rbac.authorization.k8s.io/v1"),
  subjects: z.array(subjectSchema).optional(),
  roleRef: roleRefSchema.optional(),
});
