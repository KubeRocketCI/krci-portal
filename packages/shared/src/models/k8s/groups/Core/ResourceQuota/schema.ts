import { z } from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common";

// ResourceQuota Spec
const resourceQuotaSpecSchema = z.object({
  hard: z.record(z.union([z.string(), z.number()]).optional()).optional(),
  scopeSelector: z
    .object({
      matchExpressions: z
        .array(
          z.object({
            operator: z.string(),
            scopeName: z.string(),
            values: z.array(z.string()).optional(),
          })
        )
        .optional(),
    })
    .optional(),
  scopes: z.array(z.string()).optional(),
});

// ResourceQuota Status
const resourceQuotaStatusSchema = z.object({
  hard: z.record(z.union([z.string(), z.number()])).optional(),
  used: z.record(z.union([z.string(), z.number()])).optional(),
});

// Main ResourceQuota schema
export const resourceQuotaSchema = kubeObjectBaseSchema.extend({
  kind: z.literal("ResourceQuota"),
  apiVersion: z.literal("v1"),
  metadata: kubeObjectMetadataSchema,
  spec: resourceQuotaSpecSchema.optional(),
  status: resourceQuotaStatusSchema.optional(),
});

export const resourceQuotaDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("ResourceQuota"),
  apiVersion: z.literal("v1"),
  spec: resourceQuotaSpecSchema,
});
