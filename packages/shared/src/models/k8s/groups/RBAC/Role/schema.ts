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

export const roleSchema = kubeObjectBaseSchema
  .extend({
    kind: z.literal("Role"),
    apiVersion: z.literal("rbac.authorization.k8s.io/v1"),
    metadata: kubeObjectMetadataSchema,
    rules: z.array(policyRuleSchema).optional(),
  })
  .passthrough();

export const roleDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("Role"),
  apiVersion: z.literal("rbac.authorization.k8s.io/v1"),
});
