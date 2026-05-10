import { z } from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";

const policyRuleSchema = z
  .object({
    verbs: z.array(z.string()),
    apiGroups: z.array(z.string()).optional(),
    resources: z.array(z.string()).optional(),
    resourceNames: z.array(z.string()).optional(),
    nonResourceURLs: z.array(z.string()).optional(),
  })
  .passthrough();

export const clusterRoleSchema = kubeObjectBaseSchema
  .extend({
    kind: z.literal("ClusterRole"),
    apiVersion: z.literal("rbac.authorization.k8s.io/v1"),
    metadata: kubeObjectMetadataSchema,
    rules: z.array(policyRuleSchema).optional(),
    aggregationRule: z.object({}).passthrough().optional(),
  })
  .passthrough();

export const clusterRoleDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("ClusterRole"),
  apiVersion: z.literal("rbac.authorization.k8s.io/v1"),
});
